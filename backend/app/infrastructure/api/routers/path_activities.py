from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.application.dtos import ActivityFilters, CreateActivityCommand
from app.application.use_cases.activities.create_activity import CreateActivity
from app.application.use_cases.activities.list_activities import ListActivities
from app.domain.entities import User
from app.domain.enums import ActivityStatus, Priority
from app.domain.ports import ActivityRepository, LearningPathRepository
from app.infrastructure.api.deps import (
    get_activity_repository,
    get_current_user,
    get_path_repository,
)
from app.infrastructure.api.presenters import present_activity
from app.infrastructure.api.schemas import (
    ActivityCreateRequest,
    ActivityListResponse,
    ActivityResponse,
)

router = APIRouter(prefix="/paths/{path_id}/activities", tags=["Activities"])


@router.post(
    "",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create activity in path",
    description="Leader-only endpoint that adds an activity to an owned learning path.",
    responses={
        403: {"description": "Only the owning leader can add activities."},
        404: {"description": "Path was not found."},
    },
)
def create_activity(
    path_id: UUID,
    payload: ActivityCreateRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    activities: ActivityRepository = Depends(get_activity_repository),
) -> ActivityResponse:
    activity = CreateActivity(paths, activities).execute(
        current_user,
        CreateActivityCommand(
            path_id=path_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            is_mandatory=payload.is_mandatory,
            position=payload.position,
        ),
    )
    return present_activity(activity)


@router.get(
    "",
    response_model=ActivityListResponse,
    summary="List path activities",
    description=(
        "Lists activities for a visible path. Optional filters support status and priority. "
        "`progress_percentage` is calculated over the full path, not only filtered rows."
    ),
    responses={
        403: {"description": "User cannot view this path."},
        404: {"description": "Path was not found."},
    },
)
def list_activities(
    path_id: UUID,
    status_filter: ActivityStatus | None = Query(None, alias="status"),
    priority: Priority | None = None,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> ActivityListResponse:
    path, activities = ListActivities(paths).execute(
        current_user,
        path_id,
        ActivityFilters(status=status_filter, priority=priority),
    )
    return ActivityListResponse(
        activities=[present_activity(activity) for activity in activities],
        progress_percentage=path.progress_percentage,
    )
