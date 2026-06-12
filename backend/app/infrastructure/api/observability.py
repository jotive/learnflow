import logging
import time
import uuid
from collections import Counter

from fastapi import FastAPI, Request, Response

from app.infrastructure.logging import request_id_var

logger = logging.getLogger("learnflow.api")
REQUEST_COUNT: Counter[str] = Counter()
ERROR_COUNT: Counter[str] = Counter()


def resolve_request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or uuid.uuid4().hex


def register_observability(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next) -> Response:
        request_id = resolve_request_id(request)
        token = request_id_var.set(request_id)
        started_at = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
            route_key = f"{request.method} {request.url.path}"
            REQUEST_COUNT[route_key] += 1
            if response.status_code >= 500:
                ERROR_COUNT[route_key] += 1
            logger.info(
                "request method=%s path=%s status=%s duration_ms=%s",
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
            )
            response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_var.reset(token)


def metrics_snapshot() -> dict[str, dict[str, int]]:
    return {
        "requests": dict(REQUEST_COUNT),
        "errors": dict(ERROR_COUNT),
    }
