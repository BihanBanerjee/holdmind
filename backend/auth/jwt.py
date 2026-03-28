from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

_ALGORITHM = "HS256"
_EXPIRE_DAYS = 7


def create_access_token(user_id: str) -> str:
    from config import get_settings
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    from config import get_settings
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[_ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
