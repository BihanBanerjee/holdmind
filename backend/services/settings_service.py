# holdmind/backend/services/settings_service.py
from sqlalchemy.orm import Session

from auth.encryption import encrypt_api_key, decrypt_api_key
from config import settings
from models.user import User


def save_api_key(db: Session, user: User, api_key: str) -> None:
    user.openrouter_key_enc = encrypt_api_key(api_key, settings.encryption_key_bytes)
    db.commit()


def delete_api_key(db: Session, user: User) -> None:
    user.openrouter_key_enc = None
    db.commit()


def has_api_key(user: User) -> bool:
    return bool(user.openrouter_key_enc)
