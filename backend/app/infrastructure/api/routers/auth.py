from fastapi import APIRouter, Depends

from app.application.use_cases.auth.authenticate_user import AuthenticateUser
from app.domain.ports import PasswordHasher, UserRepository
from app.infrastructure.api.deps import get_password_hasher, get_user_repository
from app.infrastructure.api.schemas import LoginRequest, TokenResponse
from app.infrastructure.auth.jwt import issue_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and issue JWT",
    description=(
        "Validates email/password credentials and returns a JWT access token. "
        "Use it as `Authorization: Bearer <token>` on protected endpoints."
    ),
    responses={401: {"description": "Invalid credentials."}},
)
def login(
    payload: LoginRequest,
    users: UserRepository = Depends(get_user_repository),
    hasher: PasswordHasher = Depends(get_password_hasher),
) -> TokenResponse:
    user = AuthenticateUser(users, hasher).execute(payload.email, payload.password)
    return TokenResponse(access_token=issue_access_token(user.id))
