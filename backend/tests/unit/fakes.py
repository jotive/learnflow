from typing import TypeVar
from uuid import UUID

from app.domain.entities import Activity, LearningPath, User
from app.domain.enums import RoleCode
from app.domain.pagination import Page, Pagination
from app.domain.ports import (
    ActivityRepository,
    LearningPathRepository,
    Notifier,
    PasswordHasher,
    UserRepository,
)

T = TypeVar("T")


def _paginate(items: list[T], page: Pagination) -> Page[T]:
    window = items[page.offset : page.offset + page.limit]
    return Page(items=window, total=len(items), limit=page.limit, offset=page.offset)


class FakeUserRepository(UserRepository):
    def __init__(self) -> None:
        self.users: dict[UUID, User] = {}

    def add(self, user: User) -> None:
        self.users[user.id] = user

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.users.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        return next((user for user in self.users.values() if user.email == email), None)

    def list_members(self, page: Pagination) -> Page[User]:
        members = sorted(
            [user for user in self.users.values() if user.role.code is RoleCode.MEMBER],
            key=lambda user: user.name,
        )
        return _paginate(members, page)

    def update(self, user: User) -> None:
        self.users[user.id] = user

    def delete(self, user_id: UUID) -> None:
        if user_id in self.users:
            self.users[user_id].is_active = False


class FakeActivityRepository(ActivityRepository):
    def __init__(self) -> None:
        self.activities: dict[UUID, Activity] = {}

    def add(self, activity: Activity) -> None:
        self.activities[activity.id] = activity

    def get(self, activity_id: UUID) -> Activity | None:
        return self.activities.get(activity_id)

    def list_for_path(self, path_id: UUID) -> list[Activity]:
        return sorted(
            [activity for activity in self.activities.values() if activity.path_id == path_id],
            key=lambda activity: activity.position,
        )

    def update(self, activity: Activity) -> None:
        self.activities[activity.id] = activity


class FakeLearningPathRepository(LearningPathRepository):
    def __init__(self, activity_repo: FakeActivityRepository) -> None:
        self.paths: dict[UUID, LearningPath] = {}
        self.activity_repo = activity_repo

    def add(self, path: LearningPath) -> None:
        self.paths[path.id] = path

    def get(self, path_id: UUID) -> LearningPath | None:
        path = self.paths.get(path_id)
        if path is None:
            return None
        path.activities = self.activity_repo.list_for_path(path_id)
        return path

    def list_owned_by(self, leader_id: UUID, page: Pagination) -> Page[LearningPath]:
        owned = [
            path
            for path in [self.get(stored.id) for stored in self.paths.values()]
            if path is not None and path.created_by == leader_id
        ]
        owned.sort(key=lambda path: path.created_at)
        return _paginate(owned, page)

    def list_assigned_to(self, member_id: UUID, page: Pagination) -> Page[LearningPath]:
        assigned_path_ids = {
            activity.path_id
            for activity in self.activity_repo.activities.values()
            if activity.assigned_to == member_id
        }
        assigned = [
            path
            for path in [self.get(path_id) for path_id in assigned_path_ids]
            if path is not None
        ]
        assigned.sort(key=lambda path: path.created_at)
        return _paginate(assigned, page)

    def update(self, path: LearningPath) -> None:
        self.paths[path.id] = path


class RecordingNotifier(Notifier):
    def __init__(self) -> None:
        self.invitations: list[User] = []
        self.assignments: list[tuple[User, Activity]] = []

    def send_invitation(self, user: User) -> None:
        self.invitations.append(user)

    def send_assignment(self, user: User, activity: Activity) -> None:
        self.assignments.append((user, activity))


class PlainTextHasher(PasswordHasher):
    def hash(self, plain: str) -> str:
        return f"hashed:{plain}"

    def verify(self, plain: str, hashed: str) -> bool:
        return hashed == f"hashed:{plain}"
