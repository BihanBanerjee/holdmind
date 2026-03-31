# holdmind/backend/tests/test_chat_integration.py
"""
Real end-to-end integration test for the chat pipeline.

Requires environment variables:
  OPENROUTER_API_KEY — a valid OpenRouter API key
  QDRANT_URL         — Qdrant Cloud cluster URL
  QDRANT_API_KEY     — Qdrant Cloud API key

Skip automatically if OPENROUTER_API_KEY is not set.
Run with: pytest tests/test_chat_integration.py -v -m integration
"""
import json
import os
import uuid

import pytest


@pytest.mark.integration
def test_chat_full_pipeline(client):
    """
    Full pipeline:
      signup → save OpenRouter key → create conversation
      → send chat message → verify SSE stream
      → verify memories stored → verify claim detail shape
      → cleanup Qdrant collection
    """
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if not openrouter_key:
        pytest.skip("OPENROUTER_API_KEY not set")

    # ── 1. Signup ──────────────────────────────────────────────────────────
    email = f"integration_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post("/api/auth/signup", json={"email": email, "password": "pass123"})
    assert resp.status_code == 201, f"signup failed: {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Capture user_id for Qdrant teardown
    me = client.get("/api/auth/me", headers=headers)
    user_id = me.json()["id"]

    try:
        # ── 2. Save OpenRouter API key ─────────────────────────────────────
        resp = client.post(
            "/api/settings/api-key",
            json={"api_key": openrouter_key},
            headers=headers,
        )
        assert resp.status_code == 200, f"save api key failed: {resp.text}"
        assert resp.json()["has_api_key"] is True

        # ── 3. Create conversation ─────────────────────────────────────────
        resp = client.post(
            "/api/conversations",
            json={"title": "Integration Test"},
            headers=headers,
        )
        assert resp.status_code == 201, f"create conversation failed: {resp.text}"
        conv_id = resp.json()["id"]

        # ── 4. Send chat message ───────────────────────────────────────────
        resp = client.post(
            f"/api/conversations/{conv_id}/chat",
            json={
                "message": "My name is Alex and I'm a software engineer who loves hiking on weekends.",
                "model": "meta-llama/llama-3.1-8b-instruct",
            },
            headers=headers,
        )
        assert resp.status_code == 200, f"chat failed: {resp.text}"
        assert "text/event-stream" in resp.headers["content-type"]

        # ── 5. Parse SSE stream ────────────────────────────────────────────
        raw_lines = [l for l in resp.text.split("\n") if l.startswith("data:")]
        assert len(raw_lines) >= 2, f"expected at least 2 SSE lines, got: {raw_lines}"

        # Must end with [DONE]
        assert raw_lines[-1] == "data: [DONE]", f"stream did not end with [DONE]: {raw_lines[-1]}"

        # At least one chunk with content
        chunk_lines = [l for l in raw_lines if l != "data: [DONE]"]
        parsed = [json.loads(l[len("data: "):]) for l in chunk_lines]
        chunks = [p for p in parsed if p.get("type") == "chunk"]
        assert len(chunks) >= 1, "no chunk events in SSE stream"
        full_text = "".join(c["content"] for c in chunks)
        assert len(full_text) > 0, "streamed content is empty"

        # ── 6. Verify memories stored ──────────────────────────────────────
        resp = client.get("/api/memories", headers=headers)
        assert resp.status_code == 200, f"memories endpoint failed: {resp.text}"
        graph = resp.json()
        assert "nodes" in graph and "links" in graph
        assert len(graph["nodes"]) >= 1, (
            "expected at least 1 claim to be extracted and stored, got 0. "
            "Check that extract_and_store ran without error."
        )

        # ── 7. Verify claim detail shape ───────────────────────────────────
        claim_id = graph["nodes"][0]["id"]
        resp = client.get(f"/api/memories/{claim_id}", headers=headers)
        assert resp.status_code == 200, f"claim detail failed: {resp.text}"
        detail = resp.json()

        required_fields = [
            "id", "type", "label", "confidence", "importance",
            "support_count", "created_at", "confidence_history",
            "supporting_ids", "contradicting_ids",
        ]
        for field in required_fields:
            assert field in detail, f"missing field '{field}' in claim detail response"

        assert detail["id"] == claim_id
        assert 0.0 <= detail["confidence"] <= 1.0
        assert 0.0 <= detail["importance"] <= 1.0
        assert isinstance(detail["confidence_history"], list)
        assert isinstance(detail["supporting_ids"], list)
        assert isinstance(detail["contradicting_ids"], list)

    finally:
        # ── 8. Teardown: delete Qdrant collection ──────────────────────────
        _cleanup_qdrant_collection(user_id)


def _cleanup_qdrant_collection(user_id: str) -> None:
    """Delete the per-user Qdrant collection created during the test."""
    try:
        from qdrant_client import QdrantClient
        from config import get_settings
        s = get_settings()
        qc = QdrantClient(url=s.qdrant_url, api_key=s.qdrant_api_key)
        collection_name = f"beliefs_{user_id}"
        collections = [c.name for c in qc.get_collections().collections]
        if collection_name in collections:
            qc.delete_collection(collection_name)
    except Exception as e:
        # Teardown failures should not mask test failures
        print(f"[integration teardown] could not delete Qdrant collection: {e}")
