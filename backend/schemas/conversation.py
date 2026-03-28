# holdmind/backend/schemas/conversation.py
from datetime import datetime
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime | None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime | None

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
