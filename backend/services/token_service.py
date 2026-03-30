# holdmind/backend/services/token_service.py
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.refresh_token import RefreshToken

_EXPIRE_DAYS = 30


def create_refresh_token(db: Session, user_id: str) -> RefreshToken:
    token_str = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=_EXPIRE_DAYS)
    row = RefreshToken(
        id=str(uuid.uuid4()),
        token=token_str,
        user_id=user_id,
        expires_at=expires_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def rotate_refresh_token(db: Session, old_token_str: str) -> RefreshToken | None:
    row = db.query(RefreshToken).filter(RefreshToken.token == old_token_str).first()
    if row is None:
        return None

    now = datetime.now(timezone.utc)
    expires_at = row.expires_at if row.expires_at.tzinfo else row.expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        db.delete(row)
        db.commit()
        return None

    user_id = row.user_id
    db.delete(row)
    db.flush()

    new_token_str = secrets.token_hex(32)
    new_expires = now + timedelta(days=_EXPIRE_DAYS)
    new_row = RefreshToken(
        id=str(uuid.uuid4()),
        token=new_token_str,
        user_id=user_id,
        expires_at=new_expires,
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)

    return new_row


def revoke_refresh_tokens(db: Session, user_id: str) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()
