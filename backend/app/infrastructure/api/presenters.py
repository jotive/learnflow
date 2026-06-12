from app.domain.entities import Activity, LearningPath, User
from app.infrastructure.api.schemas import (
    ActivityResponse,
    PathResponse,
    RoleResponse,
    UserResponse,
)


def present_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=RoleResponse(id=user.role.id, code=user.role.code, name=user.role.name),
        is_active=user.is_active,
        created_at=user.created_at,
    )


def present_activity(activity: Activity) -> ActivityResponse:
    return ActivityResponse(
        id=activity.id,
        path_id=activity.path_id,
        title=activity.title,
        description=activity.description,
        priority=activity.priority,
        is_mandatory=activity.is_mandatory,
        status=activity.status,
        assigned_to=activity.assigned_to,
        position=activity.position,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
    )


def present_path(path: LearningPath) -> PathResponse:
    return PathResponse(
        id=path.id,
        title=path.title,
        description=path.description,
        created_by=path.created_by,
        completed_at=path.completed_at,
        created_at=path.created_at,
        activity_count=path.activity_count,
        progress_percentage=path.progress_percentage,
        is_compliant=path.is_compliant,
        activities=[present_activity(activity) for activity in path.activities],
    )
