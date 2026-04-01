# holdmind/backend/routes/auth.py
import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from auth.cookies import set_refresh_cookie
from auth.dependencies import get_current_user
from auth.jwt import create_access_token
from config import settings as cfg
from database import get_db
from limiter import limiter
from models.chat_message import ChatMessage
from models.conversation import Conversation
from models.refresh_token import RefreshToken
from models.user import User
from auth.password import hash_password, verify_password
from schemas.auth import SigninRequest, SignupRequest, TokenResponse, UserResponse, UpdateProfileRequest, ChangePasswordRequest
from services.auth_service import authenticate_user, create_user
from services.token_service import create_refresh_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, response: Response, body: SignupRequest, db: Session = Depends(get_db)):
    try:
        user = create_user(db, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    token = create_access_token(user.id)
    refresh = create_refresh_token(db, user.id)
    set_refresh_cookie(response, refresh.token, request)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/signin", response_model=TokenResponse)
@limiter.limit("5/minute")
def signin(request: Request, response: Response, body: SigninRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, body.email, body.password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user.id)
    refresh = create_refresh_token(db, user.id)
    set_refresh_cookie(response, refresh.token, request)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
@limiter.limit("60/minute")
def me(request: Request, current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
@limiter.limit("30/minute")
def update_me(
    request: Request,
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.display_name is not None:
        current_user.display_name = body.display_name.strip() or None
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    # Delete per-user memory SQLite file (best-effort)
    db_path = os.path.join(cfg.memory_db_dir, f"{user_id}.db")
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except OSError:
        pass

    # Explicit cascade (SQLite does not enforce FK cascades by default)
    db.query(ChatMessage).filter(
        ChatMessage.conversation_id.in_(
            db.query(Conversation.id).filter(Conversation.user_id == user_id).subquery()
        )
    ).delete(synchronize_session=False)
    db.query(Conversation).filter(Conversation.user_id == user_id).delete(synchronize_session=False)
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()
