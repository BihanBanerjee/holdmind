# holdmind/backend/tests/test_chat.py
from unittest.mock import patch, MagicMock
import json


def test_chat_requires_auth(client):
    conv = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "p"})
    token = conv.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    c = client.post("/api/conversations", json={"title": "Test"}, headers=headers)
    conv_id = c.json()["id"]

    resp = client.post(f"/api/conversations/{conv_id}/chat",
                       json={"message": "hello"})
    assert resp.status_code in (401, 403)  # no token → unauthenticated


def test_chat_streams_sse(client, db):
    from main import app
    from auth.dependencies import require_api_key, get_current_user

    # Signup + create conversation
    resp = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "pass123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    conv = client.post("/api/conversations", json={"title": "Test"}, headers=headers)
    conv_id = conv.json()["id"]

    # Resolve the real user so get_current_user works via the existing token
    # We only need to override require_api_key to skip the encrypted-key check
    app.dependency_overrides[require_api_key] = lambda: "sk-or-test"

    mock_store = MagicMock()
    mock_store.semantic_query.return_value = []

    try:
        with patch("routes.chat.get_user_store", return_value=mock_store), \
             patch("routes.chat.stream_response", return_value=iter(["Hello", " world"])), \
             patch("routes.chat.extract_and_store", return_value=[]), \
             patch("routes.chat.save_messages"):

            resp = client.post(
                f"/api/conversations/{conv_id}/chat",
                json={"message": "hi"},
                headers=headers,
            )
    finally:
        app.dependency_overrides.pop(require_api_key, None)

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    lines = [l for l in resp.text.split("\n") if l.startswith("data:")]
    assert len(lines) >= 2
