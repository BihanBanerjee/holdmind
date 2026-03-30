# holdmind/backend/auth/cookies.py
from fastapi import Request, Response

_COOKIE_NAME = "hm_refresh"
_MAX_AGE = 2592000  # 30 days in seconds
_PATH = "/api/auth/refresh"


def set_refresh_cookie(response: Response, token: str, request: Request) -> None:
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
    )
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="strict",
        secure=is_secure,
        max_age=_MAX_AGE,
        path=_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=_COOKIE_NAME, path=_PATH)
