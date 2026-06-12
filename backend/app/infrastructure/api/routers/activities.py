from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.application.dtos import UpdateActivityCommand
from app.application.use_cases.activities.assign_activity import AssignActivity
from app.application.use_cases.activities.delete_activity import DeleteActivity
from app.application.use_cases.activities.update_activity import UpdateActivity
from app.application.use_cases.activities.update_activity_status import UpdateActivityStatus
from app.domain.entities import User
from app.domain.ports import (
    ActivityRepository,
    LearningPathRepository,
    Notifier,
    UserRepository,
)
from app.infrastructure.api.deps import (
    get_activity_repository,
    get_current_user,
    get_notifier,
    get_path_repository,
    get_user_repository,
)
from app.infrastructure.api.presenters import present_activity
from app.infrastructure.api.schemas import (
    ActivityResponse,
    ActivityStatusRequest,
    ActivityUpdateRequest,
    AssignActivityRequest,
)

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.patch(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Update activity",
    description="Leader-only endpoint for updating activity metadata on an owned path.",
    responses={
        403: {"description": "Only the owning leader can update the activity."},
        404: {"description": "Activity or path was not found."},
    },
)
def update_activity(
    activity_id: UUID,
    payload: ActivityUpdateRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    activities: ActivityRepository = Depends(get_activity_repository),
) -> ActivityResponse:
    activity = UpdateActivity(paths, activities).execute(
        current_user,
        activity_id,
        UpdateActivityCommand(
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            is_mandatory=payload.is_mandatory,
            position=payload.position,
        ),
    )
    return present_activity(activity)


@router.patch(
    "/{activity_id}/status",
    response_model=ActivityResponse,
    summary="Update activity status",
    description=(
        "Updates activity progress. Owning leaders can update any activity in their paths. "
        "Members can update only activities assigned to them."
    ),
    responses={
        403: {"description": "User cannot update this activity status."},
        404: {"description": "Activity or path was not found."},
    },
)
def update_activity_status(
    activity_id: UUID,
    payload: ActivityStatusRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    activities: ActivityRepository = Depends(get_activity_repository),
) -> ActivityResponse:
    activity = UpdateActivityStatus(paths, activities).execute(
        current_user, activity_id, payload.status
    )
    return present_activity(activity)


@router.post(
    "/{activity_id}/assign",
    response_model=ActivityResponse,
    summary="Assign activity to member",
    description=(
        "Leader-only endpoint that assigns an activity to a member and sends a fake "
        "assignment notification through the notifier port."
    ),
    responses={
        403: {"description": "Only the owning leader can assign the activity."},
        404: {"description": "Activity, path, or user was not found."},
    },
)
def assign_activity(
    activity_id: UUID,
    payload: AssignActivityRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    activities: ActivityRepository = Depends(get_activity_repository),
    users: UserRepository = Depends(get_user_repository),
    notifier: Notifier = Depends(get_notifier),
) -> ActivityResponse:
    activity = AssignActivity(paths, activities, users, notifier).execute(
        current_user, activity_id, payload.user_id
    )
    return present_activity(activity)


@router.delete(
    "/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete activity",
    description="Leader-only endpoint that deletes an activity from an owned path.",
    responses={
        403: {"description": "Only the owning leader can delete the activity."},
        404: {"description": "Activity or path was not found."},
    },
)
def delete_activity(
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    activities: ActivityRepository = Depends(get_activity_repository),
) -> Response:
    DeleteActivity(paths, activities).execute(current_user, activity_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
