from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.application.dtos import CreatePathCommand, UpdatePathCommand
from app.application.use_cases.paths.complete_path import CompletePath
from app.application.use_cases.paths.create_path import CreatePath
from app.application.use_cases.paths.delete_path import DeletePath
from app.application.use_cases.paths.get_path import GetPath
from app.application.use_cases.paths.list_paths import ListPaths
from app.application.use_cases.paths.update_path import UpdatePath
from app.domain.entities import User
from app.domain.pagination import Pagination
from app.domain.ports import LearningPathRepository
from app.infrastructure.api.deps import get_current_user, get_path_repository
from app.infrastructure.api.presenters import present_path
from app.infrastructure.api.schemas import (
    PageResponse,
    PathCreateRequest,
    PathResponse,
    PathUpdateRequest,
)

router = APIRouter(prefix="/paths", tags=["Paths"])


@router.post(
    "",
    response_model=PathResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create learning path",
    description="Leader-only endpoint that creates a learning path owned by the current user.",
    responses={403: {"description": "Only leaders can create paths."}},
)
def create_path(
    payload: PathCreateRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> PathResponse:
    path = CreatePath(paths).execute(
        current_user,
        CreatePathCommand(title=payload.title, description=payload.description),
    )
    return present_path(path)


@router.get(
    "",
    response_model=PageResponse[PathResponse],
    summary="List visible paths",
    description=(
        "Leaders receive paths they created. Members receive paths where at least one "
        "activity is assigned to them."
    ),
)
def list_paths(
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
    limit: int = Query(default=20, ge=1, le=100, description="Page size."),
    offset: int = Query(default=0, ge=0, description="Records to skip."),
) -> PageResponse[PathResponse]:
    page = ListPaths(paths).execute(current_user, Pagination(limit=limit, offset=offset))
    return PageResponse(
        items=[present_path(path) for path in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get(
    "/{path_id}",
    response_model=PathResponse,
    summary="Get path detail",
    description="Returns path detail with activities, progress percentage, and compliance state.",
    responses={
        403: {"description": "User cannot view this path."},
        404: {"description": "Path was not found."},
    },
)
def get_path(
    path_id: UUID,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> PathResponse:
    return present_path(GetPath(paths).execute(current_user, path_id))


@router.patch(
    "/{path_id}",
    response_model=PathResponse,
    summary="Update learning path",
    description="Leader-only endpoint for updating title or description of an owned path.",
    responses={
        403: {"description": "Only the owning leader can update the path."},
        404: {"description": "Path was not found."},
    },
)
def update_path(
    path_id: UUID,
    payload: PathUpdateRequest,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> PathResponse:
    path = UpdatePath(paths).execute(
        current_user,
        path_id,
        UpdatePathCommand(title=payload.title, description=payload.description),
    )
    return present_path(path)


@router.delete(
    "/{path_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete learning path",
    description="Leader-only endpoint that deletes an owned path and its activities.",
    responses={
        403: {"description": "Only the owning leader can delete the path."},
        404: {"description": "Path was not found."},
    },
)
def delete_path(
    path_id: UUID,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> Response:
    DeletePath(paths).execute(current_user, path_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{path_id}/complete",
    response_model=PathResponse,
    summary="Sign off path compliance",
    description=(
        "Marks a path as completed when it has activities and all mandatory activities "
        "are completed. Optional activities may remain open."
    ),
    responses={
        403: {"description": "Only the owning leader can sign off the path."},
        404: {"description": "Path was not found."},
        409: {"description": "Path is empty or has pending mandatory activities."},
    },
)
def complete_path(
    path_id: UUID,
    current_user: User = Depends(get_current_user),
    paths: LearningPathRepository = Depends(get_path_repository),
) -> PathResponse:
    return present_path(CompletePath(paths).execute(current_user, path_id))
