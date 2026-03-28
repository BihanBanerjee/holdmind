# holdmind/backend/routes/settings.py
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.user import User
from services.settings_service import delete_api_key, has_api_key, save_api_key

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ApiKeyRequest(BaseModel):
    api_key: str


class ApiKeyStatusResponse(BaseModel):
    has_api_key: bool


@router.get("", response_model=ApiKeyStatusResponse)
def get_status(current_user: User = Depends(get_current_user)):
    return ApiKeyStatusResponse(has_api_key=has_api_key(current_user))


@router.post("/api-key", response_model=ApiKeyStatusResponse)
def save_key(
    body: ApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    save_api_key(db, current_user, body.api_key)
    return ApiKeyStatusResponse(has_api_key=True)


@router.delete("/api-key", status_code=status.HTTP_204_NO_CONTENT)
def delete_key(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_api_key(db, current_user)
