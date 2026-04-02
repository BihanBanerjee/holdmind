# holdmind/backend/tests/test_settings.py
from unittest.mock import patch, Mock


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


def test_overwrite_api_key(client):
    headers = signup_and_get_headers(client)
    # Save first key
    client.post("/api/settings/api-key", json={"api_key": "sk-or-v1-first"}, headers=headers)
    # Overwrite with second key
    resp = client.post("/api/settings/api-key", json={"api_key": "sk-or-v1-second"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["has_api_key"] is True
    # Status still shows key present
    status = client.get("/api/settings", headers=headers)
    assert status.json()["has_api_key"] is True


def test_delete_api_key_when_none_set(client):
    headers = signup_and_get_headers(client)
    # Delete without ever saving — should succeed silently
    resp = client.delete("/api/settings/api-key", headers=headers)
    assert resp.status_code == 204


def test_validate_key_returns_valid_true_for_good_key(client):
    headers = signup_and_get_headers(client)
    mock_resp = Mock()
    mock_resp.status_code = 200
    with patch("routes.settings.requests.get", return_value=mock_resp):
        resp = client.post(
            "/api/settings/validate-key",
            json={"api_key": "sk-or-v1-valid-key"},
            headers=headers,
        )
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_validate_key_returns_valid_false_for_bad_key(client):
    headers = signup_and_get_headers(client)
    mock_resp = Mock()
    mock_resp.status_code = 401
    with patch("routes.settings.requests.get", return_value=mock_resp):
        resp = client.post(
            "/api/settings/validate-key",
            json={"api_key": "sk-or-v1-bad-key"},
            headers=headers,
        )
    assert resp.status_code == 200
    assert resp.json()["valid"] is False


def test_validate_key_returns_valid_false_on_network_error(client):
    headers = signup_and_get_headers(client)
    import requests as req_lib
    with patch("routes.settings.requests.get", side_effect=req_lib.RequestException("timeout")):
        resp = client.post(
            "/api/settings/validate-key",
            json={"api_key": "sk-or-v1-any-key"},
            headers=headers,
        )
    assert resp.status_code == 200
    assert resp.json()["valid"] is False
