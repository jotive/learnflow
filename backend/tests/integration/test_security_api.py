from uuid import uuid4

from app.infrastructure.auth.jwt import issue_access_token
from tests.integration.conftest import API


def test_request_without_token_is_unauthorized(client):
    assert client.get(f"{API}/users").status_code == 401


def test_request_with_garbage_token_is_unauthorized(client):
    headers = {"Authorization": "Bearer not-a-jwt"}
    assert client.get(f"{API}/users", headers=headers).status_code == 401


def test_valid_token_for_unknown_user_is_unauthorized(client):
    headers = {"Authorization": f"Bearer {issue_access_token(uuid4())}"}
    assert client.get(f"{API}/users", headers=headers).status_code == 401


def test_invalid_token_returns_localized_error_body(client):
    headers = {"Authorization": "Bearer not-a-jwt"}
    body = client.get(f"{API}/users", headers=headers).json()
    assert body["code"] == "invalid_token"
    assert body["message"]


def test_invalid_token_message_honors_accept_language(client):
    headers = {"Authorization": "Bearer not-a-jwt", "Accept-Language": "en"}
    body = client.get(f"{API}/users", headers=headers).json()
    assert body["message"] == "Invalid or expired authentication token."
