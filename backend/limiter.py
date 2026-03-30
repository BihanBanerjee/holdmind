# holdmind/backend/limiter.py
import logging

from fastapi import Request
from slowapi import Limiter

_logger = logging.getLogger(__name__)


def _get_rate_limit_key(request: Request) -> str:
    """Use JWT user ID for authenticated requests, remote IP as fallback."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            from auth.jwt import decode_token
            payload = decode_token(token)
            return f"user:{payload['sub']}"
        except Exception as e:
            _logger.debug("Rate limit key fallback to IP (token decode failed: %s)", e)
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_rate_limit_key)
