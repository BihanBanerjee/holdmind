# holdmind/backend/tests/test_messages.py
from services.conversation_service import save_messages


def _signup(client, email="msgs@test.com", password="pass123"):
    resp = client.post("/api/auth/signup", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _make_conv(client, headers, title="Test"):
    resp = client.post("/api/conversations", json={"title": title}, headers=headers)
    return resp.json()["id"]


def test_list_messages_empty(client):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    resp = client.get(f"/api/conversations/{conv_id}/messages", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["limit"] == 50
    assert data["offset"] == 0


def test_list_messages_after_save(client, db):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    save_messages(db, conv_id, "hello", "world")
    resp = client.get(f"/api/conversations/{conv_id}/messages", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    roles = [m["role"] for m in data["items"]]
    assert "user" in roles
    assert "assistant" in roles


def test_list_messages_pagination(client, db):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    save_messages(db, conv_id, "msg1", "reply1")
    save_messages(db, conv_id, "msg2", "reply2")

    resp = client.get(f"/api/conversations/{conv_id}/messages?limit=2&offset=0", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 4
    assert len(data["items"]) == 2

    resp2 = client.get(f"/api/conversations/{conv_id}/messages?limit=2&offset=2", headers=headers)
    assert resp2.status_code == 200
    assert len(resp2.json()["items"]) == 2


def test_list_messages_search(client, db):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    save_messages(db, conv_id, "hello world", "nice to meet you")
    save_messages(db, conv_id, "goodbye", "farewell")

    resp = client.get(f"/api/conversations/{conv_id}/messages?q=hello", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert "hello" in data["items"][0]["content"].lower()


def test_list_messages_search_case_insensitive(client, db):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    save_messages(db, conv_id, "UPPERCASE message", "reply")

    resp = client.get(f"/api/conversations/{conv_id}/messages?q=uppercase", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_list_messages_requires_auth(client):
    headers = _signup(client)
    conv_id = _make_conv(client, headers)
    resp = client.get(f"/api/conversations/{conv_id}/messages")
    assert resp.status_code in (401, 403)


def test_list_messages_wrong_conversation(client):
    headers_a = _signup(client, email="a@test.com")
    headers_b = _signup(client, email="b@test.com")
    conv_id = _make_conv(client, headers_a)

    resp = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_b)
    assert resp.status_code == 404
