# holdmind/backend/services/memory_service.py
from recollectx.claims import Claim, EpisodicClaim, SemanticClaim
from recollectx.graph.edges import BeliefEdge
from recollectx.graph.graph import BeliefGraph
from recollectx.storage.memory_store import MemoryStore

from schemas.memory import (
    ClaimDetailResponse,
    ConfidenceEventResponse,
    GraphResponse,
    LinkResponse,
    NodeResponse,
)


def _claim_label(claim: Claim) -> str:
    if isinstance(claim, SemanticClaim):
        return f"{claim.subject} {claim.predicate} {claim.object}"
    if isinstance(claim, EpisodicClaim):
        return claim.summary
    return str(claim.id)


def build_graph_data(claims: list[Claim], edges: list[BeliefEdge]) -> dict:
    nodes = [
        NodeResponse(
            id=c.id,
            type=c.type,
            label=_claim_label(c),
            confidence=c.confidence,
            importance=c.importance,
            created_at=c.created_at,
        )
        for c in claims
    ]
    links = [
        LinkResponse(source=e.src_id, target=e.dst_id, relation=e.relation)
        for e in edges
    ]
    return GraphResponse(nodes=nodes, links=links).model_dump()


def get_graph_data(store: MemoryStore) -> dict:
    claims = store.query()
    edges = store.get_all_edges()
    return build_graph_data(claims, edges)


def get_claim_detail(store: MemoryStore, claim_id: str) -> ClaimDetailResponse | None:
    claim = store.get(claim_id)
    if claim is None:
        return None

    history = store.get_confidence_history(claim_id)
    # Only load edges that involve this claim to avoid O(n) full-graph rebuild
    relevant_edges = [
        e for e in store.get_all_edges()
        if e.src_id == claim_id or e.dst_id == claim_id
    ]

    graph = BeliefGraph()
    for edge in relevant_edges:
        graph.add(edge)

    return ClaimDetailResponse(
        id=claim.id,
        type=claim.type,
        label=_claim_label(claim),
        confidence=claim.confidence,
        importance=claim.importance,
        support_count=claim.support_count,
        created_at=claim.created_at,
        confidence_history=[
            ConfidenceEventResponse(
                old_confidence=e.old_confidence,
                new_confidence=e.new_confidence,
                reason=e.reason,
                change_type=e.change_type,
                timestamp=e.timestamp,
            )
            for e in history
        ],
        supporting_ids=graph.supports(claim_id),
        contradicting_ids=graph.contradictions(claim_id),
    )
