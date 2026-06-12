from tests.integration.conftest import API, LEADER_EMAIL, MEMBER_EMAIL, PASSWORD


def test_login_returns_a_bearer_token(client):
    response = client.post(f"{API}/auth/login", json={"email": LEADER_EMAIL, "password": PASSWORD})
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_login_with_wrong_password_returns_401(client):
    response = client.post(f"{API}/auth/login", json={"email": LEADER_EMAIL, "password": "nope"})
    assert response.status_code == 401


def test_protected_endpoint_without_token_returns_403_or_401(client):
    response = client.get(f"{API}/users/me")
    assert response.status_code in (401, 403)


def test_me_returns_the_authenticated_profile(client, leader_headers):
    response = client.get(f"{API}/users/me", headers=leader_headers)
    assert response.status_code == 200
    assert response.json()["email"] == LEADER_EMAIL


def test_leader_provisions_a_member(client, leader_headers):
    response = client.post(
        f"{API}/users",
        headers=leader_headers,
        json={"email": "nina@learnflow.dev", "name": "Nina", "password": "x1234567"},
    )
    assert response.status_code == 201
    assert response.json()["role"]["code"] == "MEMBER"


def test_member_cannot_provision_accounts(client, member_headers):
    response = client.post(
        f"{API}/users",
        headers=member_headers,
        json={"email": "x@learnflow.dev", "name": "X", "password": "x1234567"},
    )
    assert response.status_code == 403


def test_leader_lists_members(client, leader_headers):
    response = client.get(f"{API}/users", headers=leader_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert [user["email"] for user in body["items"]] == [MEMBER_EMAIL]


def test_leader_updates_and_deactivates_member(client, leader_headers):
    response = client.get(f"{API}/users", headers=leader_headers)
    assert response.status_code == 200
    member_id = response.json()["items"][0]["id"]
    patch_resp = client.patch(
        f"{API}/users/{member_id}",
        headers=leader_headers,
        json={"name": "Updated Name", "email": "updated@learnflow.dev"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Updated Name"
    del_resp = client.delete(f"{API}/users/{member_id}", headers=leader_headers)
    assert del_resp.status_code == 204
    get_resp = client.get(f"{API}/users", headers=leader_headers)
    assert get_resp.status_code == 200
    body = get_resp.json()
    assert body["total"] == 0
    assert body["items"] == []


def test_deactivated_member_cannot_log_in(client, leader_headers):
    listed = client.get(f"{API}/users", headers=leader_headers)
    member_id = listed.json()["items"][0]["id"]
    client.delete(f"{API}/users/{member_id}", headers=leader_headers)
    login = client.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": PASSWORD})
    assert login.status_code == 401


def test_existing_token_stops_working_after_deactivation(client, leader_headers):
    member_login = client.post(
        f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": PASSWORD}
    )
    member_headers = {"Authorization": f"Bearer {member_login.json()['access_token']}"}
    assert client.get(f"{API}/users/me", headers=member_headers).status_code == 200

    member_id = client.get(f"{API}/users", headers=leader_headers).json()["items"][0]["id"]
    client.delete(f"{API}/users/{member_id}", headers=leader_headers)

    assert client.get(f"{API}/users/me", headers=member_headers).status_code == 401
