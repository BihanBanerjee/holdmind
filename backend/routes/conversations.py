# holdmind/backend/routes/conversations.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.conversation import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    MessageResponse,
)
from services.conversation_service import (
    create_conversation,
    delete_conversation,
    get_conversation,
    get_messages,
    list_conversations,
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create(
    body: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_conversation(db, current_user.id, body.title)


@router.get("", response_model=list[ConversationResponse])
def list_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_conversations(db, current_user.id)


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_one(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = get_conversation(db, conversation_id, current_user.id)
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    messages = get_messages(db, conversation_id)
    conv_data = ConversationResponse.model_validate(conv).model_dump()
    conv_data["messages"] = [MessageResponse.model_validate(m) for m in messages]
    return ConversationDetailResponse(**conv_data)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not delete_conversation(db, conversation_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
