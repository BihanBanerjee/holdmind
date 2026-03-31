# backend/services/pattern_service.py
import json
from sqlalchemy.orm import Session

from models.chat_message import ChatMessage
from models.conversation import Conversation
from models.user import User

_TECH_KEYWORDS = {
    "api", "function", "code", "database", "algorithm", "class", "method",
    "variable", "debug", "deploy", "server", "client", "request", "response",
    "python", "javascript", "typescript", "sql", "git", "docker", "async",
    "endpoint", "schema", "model", "query", "index", "cache", "loop", "array",
    "object", "json", "http", "rest", "graphql", "lambda", "recursion",
}

_CASUAL_WORDS = {
    "hey", "hi", "thanks", "cool", "awesome", "great", "wow", "yeah",
    "ok", "okay", "lol", "haha", "nice", "btw", "fyi", "tbh", "ngl",
    "sure", "yep", "nope",
}

_FORMAL_WORDS = {
    "therefore", "however", "furthermore", "consequently", "regarding",
    "please", "appreciate", "would", "could", "shall", "hence", "thus",
    "indeed", "certainly", "perhaps", "request", "inquire",
}


def detect_patterns(db: Session, user_id: str, sample_size: int = 30) -> dict:
    """Analyze recent user messages to detect communication style patterns.

    Returns a dict with keys: message_length, technical_depth, tone.
    Returns empty dict if insufficient data (< 3 messages).
    """
    user_conversation_ids = db.query(Conversation.id).filter(Conversation.user_id == user_id).subquery()
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id.in_(user_conversation_ids))
        .filter(ChatMessage.role == "user")
        .order_by(ChatMessage.created_at.desc())
        .limit(sample_size)
        .all()
    )

    if len(messages) < 3:
        return {}

    # Message length preference
    word_counts = [len(m.content.split()) for m in messages]
    avg_words = sum(word_counts) / len(word_counts)
    if avg_words < 15:
        message_length = "concise"
    elif avg_words > 40:
        message_length = "detailed"
    else:
        message_length = "moderate"

    # Technical depth
    tech_count = sum(
        1 for m in messages
        if any(kw in m.content.lower() for kw in _TECH_KEYWORDS)
    )
    tech_ratio = tech_count / len(messages)
    if tech_ratio > 0.3:
        technical_depth = "high"
    elif tech_ratio < 0.1:
        technical_depth = "low"
    else:
        technical_depth = "medium"

    # Tone — count messages that contain casual/formal words, not unique corpus words
    casual_count = sum(
        1 for m in messages
        if any(cw in m.content.lower().split() for cw in _CASUAL_WORDS)
    )
    formal_count = sum(
        1 for m in messages
        if any(fw in m.content.lower().split() for fw in _FORMAL_WORDS)
    )
    if casual_count > formal_count * 2:
        tone = "casual"
    elif formal_count > casual_count * 2:
        tone = "formal"
    else:
        tone = "neutral"

    return {
        "message_length": message_length,
        "technical_depth": technical_depth,
        "tone": tone,
    }


def format_patterns_for_prompt(patterns: dict) -> str:
    """Convert patterns dict into a sentence to append to the system prompt."""
    if not patterns:
        return ""

    notes = []
    length = patterns.get("message_length")
    depth = patterns.get("technical_depth")
    tone = patterns.get("tone")

    if length == "concise":
        notes.append("keep responses concise and to the point")
    elif length == "detailed":
        notes.append("the user prefers thorough, detailed explanations")

    if depth == "high":
        notes.append("use technical language freely")
    elif depth == "low":
        notes.append("avoid jargon and use plain language")

    if tone == "casual":
        notes.append("match a casual, friendly tone")
    elif tone == "formal":
        notes.append("maintain a professional tone")

    if not notes:
        return ""

    return "Communication style: " + "; ".join(notes) + "."


def update_user_patterns(db: Session, user_id: str) -> None:
    """Run detection and persist patterns to the user record."""
    patterns = detect_patterns(db, user_id)
    if not patterns:
        return
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.patterns_json = json.dumps(patterns)
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise


def get_user_patterns(db: Session, user_id: str) -> dict:
    """Load stored patterns for a user. Returns empty dict if none."""
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.patterns_json:
        try:
            return json.loads(user.patterns_json)
        except (ValueError, TypeError):
            return {}
    return {}
