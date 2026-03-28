# holdmind/backend/tests/test_settings.py


def signup_and_get_headers(client):
    resp = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "pass123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_save_api_key(client):
    headers = signup_and_get_headers(client)
    resp = client.post("/api/settings/api-key",
                       json={"api_key": "sk-or-v1-test"},
                       headers=headers)
    assert resp.status_code == 200
    assert resp.json()["has_api_key"] is True


def test_get_api_key_status_no_key(client):
    headers = signup_and_get_headers(client)
    resp = client.get("/api/settings", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["has_api_key"] is False


def test_get_api_key_status_after_save(client):
    headers = signup_and_get_headers(client)
    client.post("/api/settings/api-key", json={"api_key": "sk-or-v1-test"}, headers=headers)
    resp = client.get("/api/settings", headers=headers)
    assert resp.json()["has_api_key"] is True


def test_delete_api_key(client):
    headers = signup_and_get_headers(client)
    client.post("/api/settings/api-key", json={"api_key": "sk-or-v1-test"}, headers=headers)
    client.delete("/api/settings/api-key", headers=headers)
    resp = client.get("/api/settings", headers=headers)
    assert resp.json()["has_api_key"] is False
