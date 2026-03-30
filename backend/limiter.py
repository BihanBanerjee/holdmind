# holdmind/backend/limiter.py
from fastapi import Request
from slowapi import Limiter


def _get_rate_limit_key(request: Request) -> str:
    """Use JWT user ID for authenticated requests, remote IP as fallback."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            from auth.jwt import decode_token
            payload = decode_token(token)
            return f"user:{payload['sub']}"
        except Exception:
            pass
    return request.client.host


limiter = Limiter(key_func=_get_rate_limit_key)
