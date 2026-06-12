from fastapi import APIRouter, FastAPI

from app.infrastructure.api.routers.activities import router as activities_router
from app.infrastructure.api.routers.auth import router as auth_router
from app.infrastructure.api.routers.path_activities import router as path_activities_router
from app.infrastructure.api.routers.paths import router as paths_router
from app.infrastructure.api.routers.users import router as users_router
from app.infrastructure.settings import settings


def register_routes(app: FastAPI) -> None:
    api = APIRouter(prefix=settings.api_prefix)
    api.include_router(auth_router)
    api.include_router(users_router)
    api.include_router(paths_router)
    api.include_router(path_activities_router)
    api.include_router(activities_router)
    app.include_router(api)
