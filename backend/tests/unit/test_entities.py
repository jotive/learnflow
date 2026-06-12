from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.domain.entities import Activity, LearningPath
from app.domain.enums import ActivityStatus
from app.domain.exceptions import (
    PathHasNoActivitiesError,
    PathHasPendingMandatoryActivitiesError,
)


def build_activity(**overrides) -> Activity:
    defaults = {"path_id": uuid4(), "title": "Read SOLID chapter"}
    return Activity(**{**defaults, **overrides})


def build_path(activities: list[Activity]) -> LearningPath:
    return LearningPath(title="Backend onboarding", created_by=uuid4(), activities=activities)


def test_progress_percentage_counts_completed_over_total():
    path = build_path(
        [
            build_activity(status=ActivityStatus.COMPLETED),
            build_activity(),
            build_activity(),
        ]
    )
    assert path.progress_percentage == 33.33


def test_progress_percentage_is_zero_for_empty_path():
    assert build_path([]).progress_percentage == 0.0


def test_path_is_compliant_when_every_mandatory_activity_is_completed():
    path = build_path(
        [
            build_activity(is_mandatory=True, status=ActivityStatus.COMPLETED),
            build_activity(is_mandatory=False, status=ActivityStatus.NOT_STARTED),
        ]
    )
    assert path.is_compliant is True
    assert path.progress_percentage == 50.0


def test_path_is_not_compliant_while_a_mandatory_activity_is_pending():
    path = build_path([build_activity(is_mandatory=True, status=ActivityStatus.IN_PROGRESS)])
    assert path.is_compliant is False


def test_sign_off_rejects_empty_path():
    with pytest.raises(PathHasNoActivitiesError):
        build_path([]).sign_off(datetime.now(timezone.utc))


def test_sign_off_rejects_pending_mandatory_activities():
    path = build_path([build_activity(is_mandatory=True)])
    with pytest.raises(PathHasPendingMandatoryActivitiesError):
        path.sign_off(datetime.now(timezone.utc))


def test_sign_off_sets_completed_at_when_compliant():
    completed_at = datetime.now(timezone.utc)
    path = build_path(
        [
            build_activity(is_mandatory=True, status=ActivityStatus.COMPLETED),
            build_activity(is_mandatory=False),
        ]
    )
    path.sign_off(completed_at)
    assert path.completed_at == completed_at
