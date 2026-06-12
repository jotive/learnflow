from fastapi import FastAPI

from app.infrastructure.api.errors import register_error_handlers
from app.infrastructure.api.observability import metrics_snapshot, register_observability
from app.infrastructure.api.openapi import OPENAPI_CONTACT, OPENAPI_DESCRIPTION, OPENAPI_TAGS
from app.infrastructure.api.routes import register_routes
from app.infrastructure.api.schemas import HealthResponse, MetricsResponse, RootResponse
from app.infrastructure.api.security import register_security
from app.infrastructure.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title="LearnFlow API",
        summary="Backend API for corporate learning-path tracking.",
        description=OPENAPI_DESCRIPTION,
        version="1.0.0",
        contact=OPENAPI_CONTACT,
        openapi_tags=OPENAPI_TAGS,
    )
    register_observability(app)
    register_security(app)
    register_error_handlers(app)

    @app.get(
        "/",
        response_model=RootResponse,
        tags=["Health"],
        summary="Check API status",
        description="Returns a small message confirming the LearnFlow backend is running.",
    )
    def root() -> RootResponse:
        return RootResponse(message="LearnFlow API is running")

    @app.get(
        "/health",
        response_model=HealthResponse,
        tags=["Health"],
        summary="Health check",
        description=(
            "Returns machine-readable API health metadata for local orchestration " "and monitors."
        ),
    )
    def health() -> HealthResponse:
        return HealthResponse(status="ok", service="learnflow-api", version="1.0.0")

    @app.get(
        "/metrics",
        response_model=MetricsResponse,
        tags=["Health"],
        summary="Basic API metrics",
        description="Returns in-memory request and 5xx counters for local observability.",
    )
    def metrics() -> MetricsResponse:
        return MetricsResponse(**metrics_snapshot())

    register_routes(app)
    return app


app = create_app()
