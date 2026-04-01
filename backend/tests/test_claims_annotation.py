# backend/tests/test_claims_annotation.py
import json
import pytest

from services.conversation_service import save_messages
from models.chat_message import ChatMessage


def register_and_login(client):
    client.post("/api/auth/signup", json={"email": "ann@test.com", "password": "password123"})
    r = client.post("/api/auth/signin", json={"email": "ann@test.com", "password": "password123"})
    return r.json()["access_token"]


def make_conversation(client, token):
    r = client.post(
        "/api/conversations",
        json={"title": "Test Chat"},
        headers={"Authorization": f"Bearer {token}"},
    )
    return r.json()["id"]


def test_save_messages_stores_claims_json_on_assistant(db):
    """save_messages persists claims_json on the assistant ChatMessage row."""
    from models.conversation import Conversation
    conv = Conversation(user_id="u1", title="t")
    db.add(conv)
    db.commit()
    claims = [{"id": "c1", "type": "semantic", "text": "sky is blue", "confidence": 0.9}]
    save_messages(db, conv.id, "user msg", "assistant reply", claims)
    msgs = db.query(ChatMessage).filter_by(conversation_id=conv.id).all()
    assistant_msg = next(m for m in msgs if m.role == "assistant")
    assert assistant_msg.claims_json is not None
    stored = json.loads(assistant_msg.claims_json)
    assert stored[0]["text"] == "sky is blue"


def test_save_messages_user_row_has_no_claims_json(db):
    """save_messages leaves claims_json NULL on the user ChatMessage row."""
    from models.conversation import Conversation
    conv = Conversation(user_id="u1", title="t")
    db.add(conv)
    db.commit()
    claims = [{"id": "c1", "type": "semantic", "text": "sky is blue", "confidence": 0.9}]
    save_messages(db, conv.id, "user msg", "assistant reply", claims)
    msgs = db.query(ChatMessage).filter_by(conversation_id=conv.id).all()
    user_msg = next(m for m in msgs if m.role == "user")
    assert user_msg.claims_json is None


def test_messages_endpoint_returns_claims_on_assistant(client, db):
    """GET /messages returns non-null claims list on the assistant message."""
    token = register_and_login(client)
    conv_id = make_conversation(client, token)
    claims = [{"id": "c1", "type": "episodic", "text": "visited Paris", "confidence": 0.8}]
    save_messages(db, conv_id, "user question", "assistant answer", claims)
    r = client.get(
        f"/api/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assistant = next(m for m in items if m["role"] == "assistant")
    assert assistant["claims"] is not None
    assert assistant["claims"][0]["text"] == "visited Paris"


def test_messages_endpoint_claims_null_when_absent(client, db):
    """GET /messages returns null claims when none were stored."""
    token = register_and_login(client)
    conv_id = make_conversation(client, token)
    save_messages(db, conv_id, "user question", "assistant answer")
    r = client.get(
        f"/api/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assistant = next(m for m in items if m["role"] == "assistant")
    assert assistant["claims"] is None
