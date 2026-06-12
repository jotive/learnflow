import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    ActivityNotFoundError,
    AssigneeMustBeMemberError,
    DomainError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    PathHasNoActivitiesError,
    PathHasPendingMandatoryActivitiesError,
    PathNotFoundError,
    PermissionDeniedError,
    UserNotFoundError,
)
from app.infrastructure.i18n import get_message, resolve_locale

logger = logging.getLogger("learnflow.errors")


class UnauthorizedError(Exception):
    code = "invalid_token"


ERROR_STATUS = {
    InvalidCredentialsError: 401,
    PermissionDeniedError: 403,
    UserNotFoundError: 404,
    PathNotFoundError: 404,
    ActivityNotFoundError: 404,
    AssigneeMustBeMemberError: 409,
    EmailAlreadyRegisteredError: 409,
    PathHasNoActivitiesError: 409,
    PathHasPendingMandatoryActivitiesError: 409,
}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        status_code = ERROR_STATUS.get(type(exc), 500)
        if status_code >= 500:
            logger.error("unmapped domain error code=%s", exc.code, exc_info=exc)
        else:
            logger.warning("domain error code=%s status=%s", exc.code, status_code)
        locale = resolve_locale(request.headers.get("accept-language"))
        return JSONResponse(
            status_code=status_code,
            content={"code": exc.code, "message": get_message(exc.code, locale)},
        )

    @app.exception_handler(UnauthorizedError)
    async def handle_unauthorized(request: Request, exc: UnauthorizedError) -> JSONResponse:
        locale = resolve_locale(request.headers.get("accept-language"))
        return JSONResponse(
            status_code=401,
            content={"code": exc.code, "message": get_message(exc.code, locale)},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled error path=%s", request.url.path, exc_info=exc)
        locale = resolve_locale(request.headers.get("accept-language"))
        return JSONResponse(
            status_code=500,
            content={"code": "internal_error", "message": get_message("internal_error", locale)},
        )
