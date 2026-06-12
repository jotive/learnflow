from uuid import uuid4

from app.domain.entities import Activity, LearningPath, User
from app.domain.roles import LEADER_ROLE, MEMBER_ROLE


def build_leader(email: str = "leader@learnflow.dev") -> User:
    return User(email=email, name="Lia Leader", role=LEADER_ROLE, hashed_password="hashed")


def build_member(email: str = "member@learnflow.dev") -> User:
    return User(email=email, name="Max Member", role=MEMBER_ROLE, hashed_password="hashed")


def build_path(created_by=None, **overrides) -> LearningPath:
    return LearningPath(title="Backend onboarding", created_by=created_by or uuid4(), **overrides)


def build_activity(path_id, **overrides) -> Activity:
    defaults = {"path_id": path_id, "title": "Read SOLID chapter"}
    return Activity(**{**defaults, **overrides})
