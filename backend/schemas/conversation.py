# holdmind/backend/schemas/conversation.py
from datetime import datetime
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str


class PatchConversationRequest(BaseModel):
    title: str | None = None
    archived: bool | None = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime | None
    claims: list[dict] | None = None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    title: str
    archived: bool
    created_at: datetime | None

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []


class PaginatedConversationResponse(BaseModel):
    items: list[ConversationResponse]
    total: int
    limit: int
    offset: int


class PaginatedMessageResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    limit: int
    offset: int
