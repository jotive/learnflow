from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.application.dtos import ProvisionMemberCommand, UpdateMemberCommand
from app.application.use_cases.users.delete_member import DeleteMember
from app.application.use_cases.users.list_members import ListMembers
from app.application.use_cases.users.provision_member import ProvisionMember
from app.application.use_cases.users.update_member import UpdateMember
from app.domain.entities import User
from app.domain.pagination import Pagination
from app.domain.ports import Notifier, PasswordHasher, UserRepository
from app.infrastructure.api.deps import (
    get_current_user,
    get_notifier,
    get_password_hasher,
    get_user_repository,
)
from app.infrastructure.api.presenters import present_user
from app.infrastructure.api.schemas import (
    PageResponse,
    ProvisionMemberRequest,
    UpdateMemberRequest,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated profile",
    description="Returns the profile associated with the current Bearer token.",
    responses={401: {"description": "Missing, invalid, or expired token."}},
)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return present_user(current_user)


@router.get(
    "",
    response_model=PageResponse[UserResponse],
    summary="List members",
    description="Leader-only endpoint that returns member accounts available for assignment.",
    responses={403: {"description": "Only leaders can list members."}},
)
def list_members(
    current_user: User = Depends(get_current_user),
    users: UserRepository = Depends(get_user_repository),
    limit: int = Query(default=20, ge=1, le=100, description="Page size."),
    offset: int = Query(default=0, ge=0, description="Records to skip."),
) -> PageResponse[UserResponse]:
    page = ListMembers(users).execute(current_user, Pagination(limit=limit, offset=offset))
    return PageResponse(
        items=[present_user(user) for user in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Provision member account",
    description=(
        "Leader-only endpoint that creates a MEMBER account and sends a fake invitation "
        "notification through the notifier port."
    ),
    responses={
        403: {"description": "Only leaders can provision accounts."},
        409: {"description": "Email is already registered."},
    },
)
def provision_member(
    payload: ProvisionMemberRequest,
    current_user: User = Depends(get_current_user),
    users: UserRepository = Depends(get_user_repository),
    hasher: PasswordHasher = Depends(get_password_hasher),
    notifier: Notifier = Depends(get_notifier),
) -> UserResponse:
    user = ProvisionMember(users, hasher, notifier).execute(
        current_user,
        ProvisionMemberCommand(email=payload.email, name=payload.name, password=payload.password),
    )
    return present_user(user)


@router.patch(
    "/{id}",
    response_model=UserResponse,
    summary="Update member account",
    description="Leader-only endpoint that updates a member name, email or password.",
    responses={
        403: {"description": "Only leaders can update accounts."},
        404: {"description": "Member not found."},
        409: {"description": "Email is already registered."},
    },
)
def update_member(
    id: UUID,
    payload: UpdateMemberRequest,
    current_user: User = Depends(get_current_user),
    users: UserRepository = Depends(get_user_repository),
    hasher: PasswordHasher = Depends(get_password_hasher),
) -> UserResponse:
    user = UpdateMember(users, hasher).execute(
        current_user,
        id,
        UpdateMemberCommand(email=payload.email, name=payload.name, password=payload.password),
    )
    return present_user(user)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete member account",
    description="Leader-only endpoint that deletes a member account.",
    responses={
        403: {"description": "Only leaders can delete accounts."},
        404: {"description": "Member not found."},
    },
)
def delete_member(
    id: UUID,
    current_user: User = Depends(get_current_user),
    users: UserRepository = Depends(get_user_repository),
) -> None:
    DeleteMember(users).execute(current_user, id)
