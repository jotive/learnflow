from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.domain.enums import ActivityStatus, Priority, RoleCode
from app.domain.exceptions import (
    PathHasNoActivitiesError,
    PathHasPendingMandatoryActivitiesError,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    code: RoleCode


class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    email: str
    name: str
    role: Role
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=utcnow)


class Activity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    path_id: UUID
    title: str
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    is_mandatory: bool = False
    status: ActivityStatus = ActivityStatus.NOT_STARTED
    assigned_to: UUID | None = None
    position: int = 1
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    deleted_at: datetime | None = None
    deleted_by: UUID | None = None

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self, actor_id: UUID, at: datetime) -> None:
        self.deleted_at = at
        self.deleted_by = actor_id
        self.updated_at = at


class LearningPath(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: str | None = None
    created_by: UUID
    completed_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    deleted_at: datetime | None = None
    deleted_by: UUID | None = None
    activities: list[Activity] = Field(default_factory=list)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def activity_count(self) -> int:
        return len(self.activities)

    @property
    def progress_percentage(self) -> float:
        if not self.activities:
            return 0.0
        completed = sum(
            1 for activity in self.activities if activity.status is ActivityStatus.COMPLETED
        )
        return round(completed * 100 / len(self.activities), 2)

    @property
    def is_compliant(self) -> bool:
        return all(
            activity.status is ActivityStatus.COMPLETED
            for activity in self.activities
            if activity.is_mandatory
        )

    def sign_off(self, at: datetime) -> None:
        if not self.activities:
            raise PathHasNoActivitiesError()
        if not self.is_compliant:
            raise PathHasPendingMandatoryActivitiesError()
        self.completed_at = at
        self.updated_at = at

    def soft_delete(self, actor_id: UUID, at: datetime) -> None:
        self.deleted_at = at
        self.deleted_by = actor_id
        self.updated_at = at
