# holdmind/backend/schemas/chat.py
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    model: str = "anthropic/claude-sonnet-4-5"
