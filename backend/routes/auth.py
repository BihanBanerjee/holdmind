# holdmind/backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from auth.cookies import set_refresh_cookie
from auth.dependencies import get_current_user
from auth.jwt import create_access_token
from database import get_db
from limiter import limiter
from models.user import User
from schemas.auth import SigninRequest, SignupRequest, TokenResponse, UserResponse, UpdateProfileRequest
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
