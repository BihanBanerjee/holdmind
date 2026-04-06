# holdmind/backend/services/memory_service.py
import re

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


def make_short_id(label: str, claim_id: str) -> str:
    """Generate a human-readable slug from the claim label and first 4 chars of its UUID."""
    words = re.sub(r"[^a-z0-9]", " ", label.lower()).split()[:3]
    slug = "-".join(words) if words else "memory"
    return f"{slug}-{claim_id[:4]}"


def build_graph_data(claims: list[Claim], edges: list[BeliefEdge]) -> dict:
    nodes = [
        NodeResponse(
            id=c.id,
            type=c.type,
            label=_claim_label(c),
            short_id=make_short_id(_claim_label(c), c.id),
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


def patch_claim(store: MemoryStore, claim_id: str, new_label: str) -> ClaimDetailResponse | None:
    """Update a claim's label. For semantic claims, updates the object field.
    For episodic claims, updates the summary."""
    claim = store.get(claim_id)
    if claim is None:
        return None

    new_label = new_label.strip()
    if not new_label:
        return None

    if isinstance(claim, SemanticClaim):
        # Strip "subject predicate " prefix if the user typed the full triple
        prefix = f"{claim.subject} {claim.predicate} "
        new_object = new_label[len(prefix):] if new_label.lower().startswith(prefix.lower()) else new_label
        updated: Claim = SemanticClaim(
            id=claim.id,
            subject=claim.subject,
            predicate=claim.predicate,
            object=new_object,
            confidence=claim.confidence,
            importance=claim.importance,
            evidence=claim.evidence,
            support_count=claim.support_count,
            created_at=claim.created_at,
            last_reinforced_at=claim.last_reinforced_at,
        )
    elif isinstance(claim, EpisodicClaim):
        updated = EpisodicClaim(
            id=claim.id,
            summary=new_label,
            confidence=claim.confidence,
            importance=claim.importance,
            evidence=claim.evidence,
            support_count=claim.support_count,
            created_at=claim.created_at,
            last_reinforced_at=claim.last_reinforced_at,
        )
    else:
        return None

    store.update(updated)
    return get_claim_detail(store, claim_id)


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

    label = _claim_label(claim)
    return ClaimDetailResponse(
        id=claim.id,
        type=claim.type,
        label=label,
        short_id=make_short_id(label, claim.id),
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
