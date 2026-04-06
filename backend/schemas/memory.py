# holdmind/backend/schemas/memory.py
from pydantic import BaseModel


class NodeResponse(BaseModel):
    id: str
    type: str           # "episodic" or "semantic"
    label: str          # human-readable text
    short_id: str
    confidence: float
    importance: float
    created_at: float


class LinkResponse(BaseModel):
    source: str
    target: str
    relation: str       # supports | contradicts | derives | similar


class GraphResponse(BaseModel):
    nodes: list[NodeResponse]
    links: list[LinkResponse]


class ConfidenceEventResponse(BaseModel):
    old_confidence: float
    new_confidence: float
    reason: str
    change_type: str
    timestamp: float


class ClaimPatchRequest(BaseModel):
    label: str


class ClaimDetailResponse(BaseModel):
    id: str
    type: str
    label: str
    short_id: str
    confidence: float
    importance: float
    support_count: int
    created_at: float
    confidence_history: list[ConfidenceEventResponse]
    supporting_ids: list[str]
    contradicting_ids: list[str]
