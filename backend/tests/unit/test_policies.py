from uuid import uuid4

import pytest

from app.domain.entities import Activity, LearningPath, User
from app.domain.exceptions import PermissionDeniedError
from app.domain.policies import ensure_can_view, ensure_owner, require_leader
from app.domain.roles import LEADER_ROLE, MEMBER_ROLE


def build_leader() -> User:
    return User(email="leader@learnflow.dev", name="Lia", role=LEADER_ROLE, hashed_password="x")


def build_member() -> User:
    return User(email="member@learnflow.dev", name="Max", role=MEMBER_ROLE, hashed_password="x")


def test_require_leader_rejects_members():
    with pytest.raises(PermissionDeniedError):
        require_leader(build_member())


def test_ensure_owner_rejects_a_different_leader():
    path = LearningPath(title="Onboarding", created_by=uuid4())
    with pytest.raises(PermissionDeniedError):
        ensure_owner(path, build_leader())


def test_ensure_owner_accepts_the_creating_leader():
    leader = build_leader()
    ensure_owner(LearningPath(title="Onboarding", created_by=leader.id), leader)


def test_member_can_view_a_path_with_an_activity_assigned_to_them():
    member = build_member()
    path = LearningPath(title="Onboarding", created_by=uuid4())
    path.activities.append(Activity(path_id=path.id, title="Watch intro", assigned_to=member.id))
    ensure_can_view(path, member)


def test_member_cannot_view_an_unrelated_path():
    path = LearningPath(title="Onboarding", created_by=uuid4())
    with pytest.raises(PermissionDeniedError):
        ensure_can_view(path, build_member())
