# holdmind/backend/services/conversation_service.py
from sqlalchemy.orm import Session

from models.chat_message import ChatMessage
from models.conversation import Conversation


def create_conversation(db: Session, user_id: str, title: str) -> Conversation:
    conv = Conversation(user_id=user_id, title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def list_conversations(db: Session, user_id: str) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


def get_conversation(db: Session, conversation_id: str, user_id: str) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )


def get_messages(db: Session, conversation_id: str) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def delete_conversation(db: Session, conversation_id: str, user_id: str) -> bool:
    conv = get_conversation(db, conversation_id, user_id)
    if conv is None:
        return False
    db.delete(conv)
    db.commit()
    return True


def save_messages(
    db: Session,
    conversation_id: str,
    user_content: str,
    assistant_content: str,
) -> None:
    db.add(ChatMessage(conversation_id=conversation_id, role="user", content=user_content))
    db.add(ChatMessage(conversation_id=conversation_id, role="assistant", content=assistant_content))
    db.commit()
