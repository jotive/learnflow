from uuid import uuid4

from app.domain.entities import Activity, LearningPath, User
from app.domain.pagination import Pagination
from app.domain.roles import LEADER_ROLE
from app.infrastructure.auth.security import BcryptPasswordHasher
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyLearningPathRepository,
    SqlAlchemyUserRepository,
)
from app.infrastructure.db.seed import ensure_demo_path, ensure_users

PAGE = Pagination(limit=20, offset=0)


def test_list_owned_by_returns_leader_paths(session_factory):
    with session_factory() as session:
        users = SqlAlchemyUserRepository(session)
        paths = SqlAlchemyLearningPathRepository(session)
        leader = User(
            email="leader@learnflow.dev",
            name="Lia",
            role=LEADER_ROLE,
            hashed_password="x",
        )
        users.add(leader)
        paths.add(LearningPath(title="Owned", created_by=leader.id))
        session.commit()

        page = paths.list_owned_by(leader.id, PAGE)
        assert page.total == 1
        assert page.items[0].title == "Owned"


def test_list_for_path_skips_soft_deleted(session_factory):
    with session_factory() as session:
        paths = SqlAlchemyLearningPathRepository(session)
        activities = SqlAlchemyActivityRepository(session)
        path = LearningPath(title="Track", created_by=uuid4())
        paths.add(path)
        live = Activity(path_id=path.id, title="Live", position=1)
        gone = Activity(path_id=path.id, title="Gone", position=2)
        gone.deleted_at = live.created_at
        activities.add(live)
        activities.add(gone)
        session.commit()

        listed = activities.list_for_path(path.id)
        assert [activity.title for activity in listed] == ["Live"]


def test_update_missing_path_is_a_noop(session_factory):
    with session_factory() as session:
        paths = SqlAlchemyLearningPathRepository(session)
        paths.update(LearningPath(title="Ghost", created_by=uuid4()))


def test_update_missing_activity_is_a_noop(session_factory):
    with session_factory() as session:
        activities = SqlAlchemyActivityRepository(session)
        activities.update(Activity(path_id=uuid4(), title="Ghost", position=1))


def test_seed_helpers_are_idempotent(session_factory):
    hasher = BcryptPasswordHasher(rounds=4)
    with session_factory() as session:
        users = SqlAlchemyUserRepository(session)
        paths = SqlAlchemyLearningPathRepository(session)
        activities = SqlAlchemyActivityRepository(session)

        ensured = ensure_users(users, hasher)
        session.commit()
        leader = ensured["leader@learnflow.dev"]
        member = ensured["member1@learnflow.dev"]

        ensure_demo_path(paths, activities, leader, member)
        session.commit()
        ensure_demo_path(paths, activities, leader, member)
        session.commit()

        owned = paths.list_owned_by(leader.id, PAGE)
        assert owned.total == 1
        assert len(activities.list_for_path(owned.items[0].id)) == 4

        ensure_users(users, hasher)
        assert users.list_members(PAGE).total == 2
