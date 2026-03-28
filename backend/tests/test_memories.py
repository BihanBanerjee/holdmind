# holdmind/backend/tests/test_memories.py
from unittest.mock import patch, MagicMock
from recollectx.claims import SemanticClaim, EpisodicClaim
from recollectx.graph.edges import BeliefEdge


def make_claims():
    return [
        SemanticClaim(subject="user", predicate="likes", object="pizza", confidence=0.9, importance=0.8),
        EpisodicClaim(summary="User visited Rome", confidence=0.7, importance=0.6),
    ]

def make_edges():
    claims = make_claims()
    return [BeliefEdge(src_id=claims[0].id, dst_id=claims[1].id, relation="similar")]


def test_build_graph_data_shapes_nodes_and_links():
    from services.memory_service import build_graph_data
    claims = make_claims()
    edges = make_edges()
    result = build_graph_data(claims, edges)

    assert len(result["nodes"]) == 2
    assert len(result["links"]) == 1
    node = result["nodes"][0]
    assert "id" in node and "type" in node and "label" in node
    assert "confidence" in node and "importance" in node
    link = result["links"][0]
    assert "source" in link and "target" in link and "relation" in link


def test_graph_endpoint_returns_nodes_and_links(client):
    from main import app
    from auth.dependencies import require_api_key

    resp = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "pass123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    mock_store = MagicMock()
    mock_store.query.return_value = make_claims()
    mock_store.get_all_edges.return_value = make_edges()

    app.dependency_overrides[require_api_key] = lambda: "sk-or-test"

    try:
        with patch("routes.memories.get_user_store", return_value=mock_store):
            resp = client.get("/api/memories", headers=headers)
    finally:
        app.dependency_overrides.pop(require_api_key, None)

    assert resp.status_code == 200
    data = resp.json()
    assert "nodes" in data and "links" in data


def test_delete_memory_endpoint(client):
    from main import app
    from auth.dependencies import require_api_key

    resp = client.post("/api/auth/signup", json={"email": "u@test.com", "password": "pass123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    mock_store = MagicMock()
    mock_store.delete.return_value = True

    app.dependency_overrides[require_api_key] = lambda: "sk-or-test"

    try:
        with patch("routes.memories.get_user_store", return_value=mock_store):
            resp = client.delete("/api/memories/claim-123", headers=headers)
    finally:
        app.dependency_overrides.pop(require_api_key, None)

    assert resp.status_code == 204
