# holdmind/backend/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from auth.encryption import decrypt_api_key
from auth.jwt import decode_token
from config import settings
from database import get_db
from models.user import User

_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload["sub"]
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_api_key(current_user: User = Depends(get_current_user)) -> str:
    """Returns the decrypted OpenRouter API key or raises 403."""
    if not current_user.openrouter_key_enc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="OpenRouter API key required. Add it in Settings.",
        )
    return decrypt_api_key(current_user.openrouter_key_enc, settings.encryption_key_bytes)
