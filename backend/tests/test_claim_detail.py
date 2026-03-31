# holdmind/backend/tests/test_claim_detail.py
from unittest.mock import patch, MagicMock


def _signup(client, email="cd@test.com", password="pass123"):
    resp = client.post("/api/auth/signup", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _make_detail():
    """Return a dict matching ClaimDetailResponse shape."""
    return {
        "id": "claim-abc",
        "type": "semantic",
        "label": "sky has_color blue",
        "confidence": 0.9,
        "importance": 0.7,
        "support_count": 1,
        "created_at": 1700000000.0,
        "confidence_history": [],
        "supporting_ids": [],
        "contradicting_ids": [],
    }


def test_get_claim_detail_not_found(client):
    from main import app
    from auth.dependencies import require_api_key

    headers = _signup(client)
    app.dependency_overrides[require_api_key] = lambda: "sk-or-test"

    mock_store = MagicMock()
    try:
        with patch("routes.memories.get_user_store", return_value=mock_store), \
             patch("routes.memories.get_claim_detail", return_value=None):
            resp = client.get("/api/memories/nonexistent-id", headers=headers)
    finally:
        app.dependency_overrides.pop(require_api_key, None)

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Claim not found"


def test_get_claim_detail_requires_auth(client):
    resp = client.get("/api/memories/some-claim-id")
    assert resp.status_code in (401, 403)


def test_get_claim_detail_requires_api_key(client):
    headers = _signup(client)
    # No dependency override — require_api_key runs for real, user has no API key
    resp = client.get("/api/memories/some-claim-id", headers=headers)
    assert resp.status_code == 403
    assert "OpenRouter API key required" in resp.json()["detail"]
