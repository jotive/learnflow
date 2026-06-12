from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities import Activity, LearningPath, User
from app.domain.pagination import Page, Pagination


class UserRepository(ABC):
    @abstractmethod
    def add(self, user: User) -> None: ...

    @abstractmethod
    def get_by_id(self, user_id: UUID) -> User | None: ...

    @abstractmethod
    def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    def list_members(self, page: Pagination) -> Page[User]: ...

    @abstractmethod
    def update(self, user: User) -> None: ...

    @abstractmethod
    def delete(self, user_id: UUID) -> None: ...


class LearningPathRepository(ABC):
    @abstractmethod
    def add(self, path: LearningPath) -> None: ...

    @abstractmethod
    def get(self, path_id: UUID) -> LearningPath | None: ...

    @abstractmethod
    def list_owned_by(self, leader_id: UUID, page: Pagination) -> Page[LearningPath]: ...

    @abstractmethod
    def list_assigned_to(self, member_id: UUID, page: Pagination) -> Page[LearningPath]: ...

    @abstractmethod
    def update(self, path: LearningPath) -> None: ...


class ActivityRepository(ABC):
    @abstractmethod
    def add(self, activity: Activity) -> None: ...

    @abstractmethod
    def get(self, activity_id: UUID) -> Activity | None: ...

    @abstractmethod
    def list_for_path(self, path_id: UUID) -> list[Activity]: ...

    @abstractmethod
    def update(self, activity: Activity) -> None: ...


class Notifier(ABC):
    @abstractmethod
    def send_invitation(self, user: User) -> None: ...

    @abstractmethod
    def send_assignment(self, user: User, activity: Activity) -> None: ...


class PasswordHasher(ABC):
    @abstractmethod
    def hash(self, plain: str) -> str: ...

    @abstractmethod
    def verify(self, plain: str, hashed: str) -> bool: ...
