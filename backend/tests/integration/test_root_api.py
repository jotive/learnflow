def test_root_returns_api_status(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LearnFlow API is running"}


def test_health_returns_machine_readable_status(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "learnflow-api",
        "version": "1.0.0",
    }


def test_metrics_returns_observability_counters(client):
    client.get("/health")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "GET /health" in response.json()["requests"]
    assert isinstance(response.json()["errors"], dict)
