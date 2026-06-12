from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.enums import ActivityStatus, Priority, RoleCode

T = TypeVar("T")


class LoginRequest(BaseModel):
    email: EmailStr = Field(
        examples=["leader@learnflow.dev"],
        description="Registered user email.",
    )
    password: str = Field(
        examples=["leader-pass"],
        description="Plain password verified against the stored bcrypt hash.",
    )

    model_config = ConfigDict(
        json_schema_extra={"example": {"email": "leader@learnflow.dev", "password": "leader-pass"}}
    )


class TokenResponse(BaseModel):
    access_token: str = Field(description="JWT access token used as Bearer credentials.")
    token_type: str = Field(default="bearer", description="Authentication scheme.")


class RoleResponse(BaseModel):
    id: UUID = Field(description="Role identifier.")
    code: RoleCode = Field(description="Stable role code used by access policies.")
    name: str = Field(description="Human-readable role name.")


class UserResponse(BaseModel):
    id: UUID = Field(description="User identifier.")
    email: EmailStr = Field(description="User email.")
    name: str = Field(description="Display name.")
    role: RoleResponse = Field(description="User role in LearnFlow.")
    is_active: bool = Field(description="True if the user account is active.")
    created_at: datetime = Field(description="UTC creation timestamp.")


class ProvisionMemberRequest(BaseModel):
    email: EmailStr = Field(examples=["member3@learnflow.dev"])
    name: str = Field(min_length=1, max_length=120, examples=["Nina Member"])
    password: str = Field(min_length=8, examples=["member-pass"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "member3@learnflow.dev",
                "name": "Nina Member",
                "password": "member-pass",
            }
        }
    )


class UpdateMemberRequest(BaseModel):
    email: EmailStr | None = Field(default=None, examples=["member3@learnflow.dev"])
    name: str | None = Field(default=None, min_length=1, max_length=120, examples=["Nina Member"])
    password: str | None = Field(default=None, min_length=8, examples=["member-pass"])


class PathCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200, examples=["Backend onboarding"])
    description: str | None = Field(
        default=None,
        max_length=2000,
        examples=["Mandatory backend onboarding path for new team members."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Backend onboarding",
                "description": "Mandatory backend onboarding path for new team members.",
            }
        }
    )


class PathUpdateRequest(BaseModel):
    title: str | None = Field(
        default=None, min_length=1, max_length=200, examples=["Backend onboarding v2"]
    )
    description: str | None = Field(
        default=None, max_length=2000, examples=["Updated onboarding path."]
    )


class ActivityCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200, examples=["Read SOLID chapter"])
    description: str | None = Field(
        default=None, max_length=2000, examples=["Read and summarize the chapter."]
    )
    priority: Priority = Field(default=Priority.MEDIUM, description="Urgency used for filtering.")
    is_mandatory: bool = Field(
        default=False,
        description="Whether the activity blocks path sign-off until completed.",
    )
    position: int = Field(default=1, ge=1, description="Display order inside the path.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Read SOLID chapter",
                "description": "Read and summarize the chapter.",
                "priority": "HIGH",
                "is_mandatory": True,
                "position": 1,
            }
        }
    )


class ActivityUpdateRequest(BaseModel):
    title: str | None = Field(
        default=None, min_length=1, max_length=200, examples=["Read clean architecture chapter"]
    )
    description: str | None = Field(
        default=None, max_length=2000, examples=["Updated activity description."]
    )
    priority: Priority | None = None
    is_mandatory: bool | None = None
    position: int | None = Field(default=None, ge=1)


class ActivityStatusRequest(BaseModel):
    status: ActivityStatus = Field(
        description="New activity progress status.",
        examples=["IN_PROGRESS"],
    )


class AssignActivityRequest(BaseModel):
    user_id: UUID | None = Field(
        default=None,
        description="Member identifier that will receive the activity, or null to unassign.",
    )


class ActivityResponse(BaseModel):
    id: UUID = Field(description="Activity identifier.")
    path_id: UUID = Field(description="Learning path that owns this activity.")
    title: str
    description: str | None
    priority: Priority
    is_mandatory: bool
    status: ActivityStatus
    assigned_to: UUID | None = Field(description="Assigned member identifier, when assigned.")
    position: int
    created_at: datetime
    updated_at: datetime


class PathResponse(BaseModel):
    id: UUID = Field(description="Learning path identifier.")
    title: str
    description: str | None
    created_by: UUID = Field(description="Leader who created the path.")
    completed_at: datetime | None = Field(description="UTC sign-off timestamp, when completed.")
    created_at: datetime
    activity_count: int = Field(description="Number of activities in the path.")
    progress_percentage: float = Field(description="Completed activities over total activities.")
    is_compliant: bool = Field(description="True when every mandatory activity is completed.")
    activities: list[ActivityResponse] = Field(default_factory=list)


class ActivityListResponse(BaseModel):
    activities: list[ActivityResponse]
    progress_percentage: float = Field(description="Path progress before filtering is applied.")


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    service: str = Field(examples=["learnflow-api"])
    version: str = Field(examples=["1.0.0"])


class MetricsResponse(BaseModel):
    requests: dict[str, int] = Field(description="Request count grouped by method and path.")
    errors: dict[str, int] = Field(description="5xx response count grouped by method and path.")


class RootResponse(BaseModel):
    message: str = Field(examples=["LearnFlow API is running"])


class PageResponse(BaseModel, Generic[T]):
    items: list[T] = Field(description="Records for the requested window.")
    total: int = Field(description="Total matching records ignoring pagination.")
    limit: int = Field(description="Page size used for this response.")
    offset: int = Field(description="Number of records skipped before this window.")


class ErrorResponse(BaseModel):
    code: str = Field(
        examples=["path_not_found"],
        description="Stable machine-readable error code, locale-independent.",
    )
    message: str = Field(
        examples=["La ruta de aprendizaje no existe."],
        description="Human-readable message resolved from the Accept-Language header.",
    )
