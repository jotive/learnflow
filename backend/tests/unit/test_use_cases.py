from uuid import uuid4

import pytest

from app.application.dtos import (
    CreateActivityCommand,
    CreatePathCommand,
    ProvisionMemberCommand,
    UpdateMemberCommand,
)
from app.application.use_cases.activities.assign_activity import AssignActivity
from app.application.use_cases.activities.create_activity import CreateActivity
from app.application.use_cases.activities.update_activity_status import UpdateActivityStatus
from app.application.use_cases.auth.authenticate_user import AuthenticateUser
from app.application.use_cases.paths.complete_path import CompletePath
from app.application.use_cases.paths.create_path import CreatePath
from app.application.use_cases.users.delete_member import DeleteMember
from app.application.use_cases.users.provision_member import ProvisionMember
from app.application.use_cases.users.update_member import UpdateMember
from app.domain.enums import ActivityStatus
from app.domain.exceptions import (
    ActivityNotFoundError,
    AssigneeMustBeMemberError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    PathHasPendingMandatoryActivitiesError,
    PathNotFoundError,
    PermissionDeniedError,
    UserNotFoundError,
)
from tests.unit.factories import build_activity, build_leader, build_member
from tests.unit.fakes import (
    FakeActivityRepository,
    FakeLearningPathRepository,
    FakeUserRepository,
    PlainTextHasher,
    RecordingNotifier,
)


def build_services():
    users = FakeUserRepository()
    activities = FakeActivityRepository()
    paths = FakeLearningPathRepository(activities)
    notifier = RecordingNotifier()
    hasher = PlainTextHasher()
    return users, paths, activities, notifier, hasher


def test_authenticate_user_rejects_invalid_credentials():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    leader.hashed_password = hasher.hash("secret123")
    users.add(leader)
    with pytest.raises(InvalidCredentialsError):
        AuthenticateUser(users, hasher).execute(leader.email, "wrong-pass")


def test_leader_provisions_member_and_sends_invitation():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    user = ProvisionMember(users, hasher, notifier).execute(
        leader,
        ProvisionMemberCommand(email="new@learnflow.dev", name="New Member", password="secret123"),
    )
    assert users.get_by_email(user.email) == user
    assert notifier.invitations == [user]


def test_duplicate_member_email_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    with pytest.raises(EmailAlreadyRegisteredError):
        ProvisionMember(users, hasher, notifier).execute(
            leader,
            ProvisionMemberCommand(email=member.email, name="Duplicate", password="secret123"),
        )


def test_member_cannot_create_paths():
    users, paths, activities, notifier, hasher = build_services()
    with pytest.raises(PermissionDeniedError):
        CreatePath(paths).execute(build_member(), CreatePathCommand(title="Nope"))


def test_assignment_notifies_assignee_and_allows_status_progress():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    activity = CreateActivity(paths, activities).execute(
        leader, CreateActivityCommand(path_id=path.id, title="Read policy")
    )

    assigned = AssignActivity(paths, activities, users, notifier).execute(
        leader, activity.id, member.id
    )
    progressed = UpdateActivityStatus(paths, activities).execute(
        member, activity.id, ActivityStatus.IN_PROGRESS
    )

    assert assigned.assigned_to == member.id
    assert progressed.status is ActivityStatus.IN_PROGRESS
    assert notifier.assignments == [(member, assigned)]


def test_activity_cannot_be_assigned_to_leader():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    users.add(leader)
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    activity = CreateActivity(paths, activities).execute(
        leader, CreateActivityCommand(path_id=path.id, title="Read policy")
    )

    with pytest.raises(AssigneeMustBeMemberError):
        AssignActivity(paths, activities, users, notifier).execute(leader, activity.id, leader.id)

    assert notifier.assignments == []


def test_assigning_missing_activity_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    with pytest.raises(ActivityNotFoundError):
        AssignActivity(paths, activities, users, notifier).execute(build_leader(), uuid4(), uuid4())


def test_assigning_activity_without_its_path_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    orphan = build_activity(path_id=uuid4())
    activities.add(orphan)
    with pytest.raises(PathNotFoundError):
        AssignActivity(paths, activities, users, notifier).execute(
            build_leader(), orphan.id, uuid4()
        )


def test_assigning_unknown_user_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    activity = CreateActivity(paths, activities).execute(
        leader, CreateActivityCommand(path_id=path.id, title="Read policy")
    )
    with pytest.raises(UserNotFoundError):
        AssignActivity(paths, activities, users, notifier).execute(leader, activity.id, uuid4())


def test_passing_none_assignee_clears_the_assignment():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    activity = CreateActivity(paths, activities).execute(
        leader, CreateActivityCommand(path_id=path.id, title="Read policy")
    )
    AssignActivity(paths, activities, users, notifier).execute(leader, activity.id, member.id)

    cleared = AssignActivity(paths, activities, users, notifier).execute(leader, activity.id, None)

    assert cleared.assigned_to is None
    assert notifier.assignments == [(member, activity)]


def test_path_completion_requires_mandatory_activities_done():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    CreateActivity(paths, activities).execute(
        leader,
        CreateActivityCommand(path_id=path.id, title="Mandatory", is_mandatory=True),
    )
    with pytest.raises(PathHasPendingMandatoryActivitiesError):
        CompletePath(paths).execute(leader, path.id)


def test_leader_updates_member():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    updated = UpdateMember(users, hasher).execute(
        leader, member.id, UpdateMemberCommand(name="Updated Name", email="updated@learnflow.dev")
    )
    assert updated.name == "Updated Name"
    assert updated.email == "updated@learnflow.dev"


def test_leader_deactivates_member():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    DeleteMember(users).execute(leader, member.id)
    assert not member.is_active


def test_updating_unknown_member_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    with pytest.raises(UserNotFoundError):
        UpdateMember(users, hasher).execute(
            build_leader(), uuid4(), UpdateMemberCommand(name="Ghost")
        )


def test_updating_member_to_a_taken_email_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    other = build_member(email="taken@learnflow.dev")
    users.add(member)
    users.add(other)
    with pytest.raises(EmailAlreadyRegisteredError):
        UpdateMember(users, hasher).execute(
            leader, member.id, UpdateMemberCommand(email=other.email)
        )


def test_updating_member_password_rehashes_it():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    users.add(member)
    updated = UpdateMember(users, hasher).execute(
        leader, member.id, UpdateMemberCommand(password="new-secret")
    )
    assert updated.hashed_password == hasher.hash("new-secret")


def test_deleting_unknown_member_is_rejected():
    users, paths, activities, notifier, hasher = build_services()
    with pytest.raises(UserNotFoundError):
        DeleteMember(users).execute(build_leader(), uuid4())


def test_authenticate_user_rejects_deactivated_account():
    users, paths, activities, notifier, hasher = build_services()
    member = build_member()
    member.hashed_password = hasher.hash("secret123")
    member.is_active = False
    users.add(member)
    with pytest.raises(InvalidCredentialsError):
        AuthenticateUser(users, hasher).execute(member.email, "secret123")


def test_cannot_assign_activity_to_a_deactivated_member():
    users, paths, activities, notifier, hasher = build_services()
    leader = build_leader()
    member = build_member()
    member.is_active = False
    users.add(member)
    path = CreatePath(paths).execute(leader, CreatePathCommand(title="Onboarding"))
    activity = CreateActivity(paths, activities).execute(
        leader, CreateActivityCommand(path_id=path.id, title="Read policy")
    )
    with pytest.raises(AssigneeMustBeMemberError):
        AssignActivity(paths, activities, users, notifier).execute(leader, activity.id, member.id)
