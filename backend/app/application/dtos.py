from dataclasses import dataclass
from uuid import UUID

from app.domain.enums import ActivityStatus, Priority


@dataclass(frozen=True)
class ProvisionMemberCommand:
    email: str
    name: str
    password: str


@dataclass(frozen=True)
class CreatePathCommand:
    title: str
    description: str | None = None


@dataclass(frozen=True)
class UpdatePathCommand:
    title: str | None = None
    description: str | None = None


@dataclass(frozen=True)
class CreateActivityCommand:
    path_id: UUID
    title: str
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    is_mandatory: bool = False
    position: int = 1


@dataclass(frozen=True)
class UpdateActivityCommand:
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None
    is_mandatory: bool | None = None
    position: int | None = None


@dataclass(frozen=True)
class ActivityFilters:
    status: ActivityStatus | None = None
    priority: Priority | None = None


@dataclass(frozen=True)
class UpdateMemberCommand:
    email: str | None = None
    name: str | None = None
    password: str | None = None
