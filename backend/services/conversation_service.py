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


def list_conversations(
    db: Session,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    archived: bool = False,
    q: str | None = None,
) -> tuple[list[Conversation], int]:
    query = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.archived == archived)
        .order_by(Conversation.created_at.desc())
    )
    if q:
        query = query.filter(Conversation.title.ilike(f"%{q}%"))
    total = query.count()
    items = query.limit(limit).offset(offset).all()
    return items, total


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


def patch_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
    title: str | None = None,
    archived: bool | None = None,
) -> Conversation | None:
    conv = get_conversation(db, conversation_id, user_id)
    if conv is None:
        return None
    if title is not None:
        conv.title = title
    if archived is not None:
        conv.archived = archived
    db.commit()
    db.refresh(conv)
    return conv


def list_messages(
    db: Session,
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    q: str | None = None,
) -> tuple[list[ChatMessage], int]:
    query = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id)
    if q:
        query = query.filter(ChatMessage.content.ilike(f"%{q}%"))
    query = query.order_by(ChatMessage.created_at.asc())
    total = query.count()
    items = query.limit(limit).offset(offset).all()
    return items, total


def save_messages(
    db: Session,
    conversation_id: str,
    user_content: str,
    assistant_content: str,
) -> None:
    db.add(ChatMessage(conversation_id=conversation_id, role="user", content=user_content))
    db.add(ChatMessage(conversation_id=conversation_id, role="assistant", content=assistant_content))
    db.commit()


def auto_title_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
    first_message: str,
) -> None:
    """Set the conversation title from the first user message if still default."""
    conv = get_conversation(db, conversation_id, user_id)
    if conv is None or conv.title != "New Chat":
        return
    msg_count = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.role == "user",
        )
        .count()
    )
    if msg_count != 1:  # exactly 1 user message after first exchange
        return
    conv.title = first_message.strip()[:50]
    db.commit()
