from tests.integration.conftest import API
from tests.integration.test_paths_api import add_activity, create_path


def member_id(client, leader_headers):
    response = client.post(
        f"{API}/users",
        headers=leader_headers,
        json={"email": "assignee@learnflow.dev", "name": "Ana", "password": "x1234567"},
    )
    return response.json()["id"]


def test_list_activities_filters_and_reports_completion(client, leader_headers):
    path = create_path(client, leader_headers)
    high = add_activity(client, leader_headers, path["id"], priority="HIGH")
    add_activity(client, leader_headers, path["id"], title="Low", priority="LOW")
    client.patch(
        f"{API}/activities/{high['id']}/status",
        headers=leader_headers,
        json={"status": "COMPLETED"},
    )

    response = client.get(
        f"{API}/paths/{path['id']}/activities?status=COMPLETED&priority=HIGH",
        headers=leader_headers,
    )
    body = response.json()
    assert [activity["title"] for activity in body["activities"]] == ["Read SOLID chapter"]
    assert body["progress_percentage"] == 50.0


def test_assignment_flow_lets_member_progress_their_activity(client, leader_headers):
    path = create_path(client, leader_headers)
    activity = add_activity(client, leader_headers, path["id"])
    assignee = member_id(client, leader_headers)

    assigned = client.post(
        f"{API}/activities/{activity['id']}/assign",
        headers=leader_headers,
        json={"user_id": assignee},
    )
    assert assigned.status_code == 200
    assert assigned.json()["assigned_to"] == assignee

    login = client.post(
        f"{API}/auth/login", json={"email": "assignee@learnflow.dev", "password": "x1234567"}
    )
    member_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    progressed = client.patch(
        f"{API}/activities/{activity['id']}/status",
        headers=member_headers,
        json={"status": "IN_PROGRESS"},
    )
    assert progressed.status_code == 200

    paths_seen = client.get(f"{API}/paths", headers=member_headers).json()
    assert [path_seen["id"] for path_seen in paths_seen["items"]] == [path["id"]]


def test_member_cannot_touch_unassigned_activity(client, leader_headers, member_headers):
    path = create_path(client, leader_headers)
    activity = add_activity(client, leader_headers, path["id"])
    response = client.patch(
        f"{API}/activities/{activity['id']}/status",
        headers=member_headers,
        json={"status": "COMPLETED"},
    )
    assert response.status_code == 403


def test_update_and_delete_activity(client, leader_headers):
    path = create_path(client, leader_headers)
    activity = add_activity(client, leader_headers, path["id"])

    renamed = client.patch(
        f"{API}/activities/{activity['id']}", headers=leader_headers, json={"title": "Renamed"}
    )
    assert renamed.json()["title"] == "Renamed"

    deleted = client.delete(f"{API}/activities/{activity['id']}", headers=leader_headers)
    assert deleted.status_code == 204
    response = client.patch(
        f"{API}/activities/{activity['id']}", headers=leader_headers, json={"title": "Ghost"}
    )
    assert response.status_code == 404
