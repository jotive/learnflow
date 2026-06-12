from tests.integration.conftest import API


def create_path(client, headers, title="Backend onboarding"):
    response = client.post(f"{API}/paths", headers=headers, json={"title": title})
    assert response.status_code == 201
    return response.json()


def add_activity(client, headers, path_id, **overrides):
    payload = {"title": "Read SOLID chapter", **overrides}
    response = client.post(f"{API}/paths/{path_id}/activities", headers=headers, json=payload)
    assert response.status_code == 201
    return response.json()


def test_blank_path_title_is_rejected(client, leader_headers):
    response = client.post(f"{API}/paths", headers=leader_headers, json={"title": ""})
    assert response.status_code == 422


def test_path_crud_lifecycle(client, leader_headers):
    path = create_path(client, leader_headers)
    path_id = path["id"]

    detail = client.get(f"{API}/paths/{path_id}", headers=leader_headers).json()
    assert detail["progress_percentage"] == 0.0

    patched = client.patch(
        f"{API}/paths/{path_id}", headers=leader_headers, json={"title": "Renamed"}
    )
    assert patched.json()["title"] == "Renamed"

    assert client.delete(f"{API}/paths/{path_id}", headers=leader_headers).status_code == 204
    assert client.get(f"{API}/paths/{path_id}", headers=leader_headers).status_code == 404


def test_member_cannot_create_paths(client, member_headers):
    response = client.post(f"{API}/paths", headers=member_headers, json={"title": "Nope"})
    assert response.status_code == 403


def test_complete_path_blocked_then_allowed(client, leader_headers):
    path = create_path(client, leader_headers)
    mandatory = add_activity(client, leader_headers, path["id"], is_mandatory=True)
    add_activity(client, leader_headers, path["id"], title="Optional", is_mandatory=False)

    blocked = client.post(f"{API}/paths/{path['id']}/complete", headers=leader_headers)
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "path_has_pending_mandatory_activities"

    client.patch(
        f"{API}/activities/{mandatory['id']}/status",
        headers=leader_headers,
        json={"status": "COMPLETED"},
    )
    completed = client.post(f"{API}/paths/{path['id']}/complete", headers=leader_headers)
    assert completed.status_code == 200
    assert completed.json()["completed_at"] is not None
    assert completed.json()["progress_percentage"] == 50.0


def test_completing_an_empty_path_returns_409(client, leader_headers):
    path = create_path(client, leader_headers)
    response = client.post(f"{API}/paths/{path['id']}/complete", headers=leader_headers)
    assert response.status_code == 409
    assert response.json()["code"] == "path_has_no_activities"
