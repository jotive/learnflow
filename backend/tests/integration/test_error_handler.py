from fastapi.testclient import TestClient

from app.infrastructure.api.errors import register_error_handlers


def build_failing_client() -> TestClient:
    from fastapi import FastAPI

    app = FastAPI()
    register_error_handlers(app)

    @app.get("/boom")
    def boom() -> None:
        raise RuntimeError("unexpected failure")

    return TestClient(app, raise_server_exceptions=False)


def test_unhandled_exception_returns_localized_internal_error():
    client = build_failing_client()
    response = client.get("/boom", headers={"Accept-Language": "en"})
    assert response.status_code == 500
    body = response.json()
    assert body["code"] == "internal_error"
    assert body["message"] == "An internal error occurred. Please try again later."


def test_unhandled_exception_defaults_to_spanish():
    client = build_failing_client()
    response = client.get("/boom")
    assert response.status_code == 500
    assert response.json()["message"] == "Ocurrió un error interno. Inténtalo de nuevo más tarde."
