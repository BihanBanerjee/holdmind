# holdmind/backend/tests/test_conversations.py
import pytest

@pytest.fixture
def auth_client(client):
    """Returns (client, auth_headers) after signup."""
    resp = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "pass123"})
    token = resp.json()["access_token"]
    return client, {"Authorization": f"Bearer {token}"}

def test_create_conversation(auth_client):
    client, headers = auth_client
    resp = client.post("/api/conversations", json={"title": "Test Chat"}, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Chat"
    assert "id" in data

def test_list_conversations_empty(auth_client):
    client, headers = auth_client
    resp = client.get("/api/conversations", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["items"] == []

def test_list_conversations_after_create(auth_client):
    client, headers = auth_client
    client.post("/api/conversations", json={"title": "Chat 1"}, headers=headers)
    client.post("/api/conversations", json={"title": "Chat 2"}, headers=headers)
    resp = client.get("/api/conversations", headers=headers)
    assert len(resp.json()["items"]) == 2

def test_get_conversation_with_messages(auth_client):
    client, headers = auth_client
    create = client.post("/api/conversations", json={"title": "Chat"}, headers=headers)
    conv_id = create.json()["id"]
    resp = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert resp.status_code == 200
    assert "messages" in resp.json()

def test_delete_conversation(auth_client):
    client, headers = auth_client
    create = client.post("/api/conversations", json={"title": "Chat"}, headers=headers)
    conv_id = create.json()["id"]
    client.delete(f"/api/conversations/{conv_id}", headers=headers)
    resp = client.get("/api/conversations", headers=headers)
    assert resp.json()["items"] == []

def test_cannot_access_another_users_conversation(client):
    # Create user A's conversation
    a = client.post("/api/auth/signup", json={"email": "a@test.com", "password": "pass"})
    a_token = a.json()["access_token"]
    conv = client.post("/api/conversations", json={"title": "Private"},
                       headers={"Authorization": f"Bearer {a_token}"})
    conv_id = conv.json()["id"]

    # User B tries to access it
    b = client.post("/api/auth/signup", json={"email": "b@test.com", "password": "pass"})
    b_token = b.json()["access_token"]
    resp = client.get(f"/api/conversations/{conv_id}",
                      headers={"Authorization": f"Bearer {b_token}"})
    assert resp.status_code == 404


def test_list_conversations_returns_paginated_shape(auth_client):
    client, headers = auth_client
    resp = client.get("/api/conversations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert data["items"] == []
    assert data["total"] == 0


def test_list_conversations_paginated(auth_client):
    client, headers = auth_client
    for i in range(5):
        client.post("/api/conversations", json={"title": f"Chat {i}"}, headers=headers)
    resp = client.get("/api/conversations?limit=3&offset=0", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 3
    assert data["limit"] == 3
    assert data["offset"] == 0


def test_list_conversations_offset(auth_client):
    client, headers = auth_client
    for i in range(5):
        client.post("/api/conversations", json={"title": f"Chat {i}"}, headers=headers)
    resp = client.get("/api/conversations?limit=3&offset=3", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2


def test_list_conversations_archived_filter(auth_client):
    client, headers = auth_client
    resp = client.get("/api/conversations?archived=true", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["items"] == []
