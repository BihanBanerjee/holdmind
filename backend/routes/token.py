# holdmind/backend/routes/token.py
from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from auth.cookies import clear_refresh_cookie, set_refresh_cookie, COOKIE_NAME
from auth.dependencies import get_current_user
from schemas.auth import RefreshResponse
from auth.jwt import create_access_token
from database import get_db
from limiter import limiter
from models.user import User
from services.token_service import revoke_refresh_tokens, rotate_refresh_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("60/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token_str = request.cookies.get(COOKIE_NAME)
    if not token_str:
        clear_refresh_cookie(response)
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing refresh token"},
        )
    new_row = rotate_refresh_token(db, token_str)
    if new_row is None:
        clear_refresh_cookie(response)
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired refresh token"},
        )
    new_jwt = create_access_token(new_row.user_id)
    set_refresh_cookie(response, new_row.token, request)
    return RefreshResponse(access_token=new_jwt)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    revoke_refresh_tokens(db, current_user.id)
    clear_refresh_cookie(response)
