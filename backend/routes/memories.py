# holdmind/backend/routes/memories.py
from fastapi import APIRouter, Depends, HTTPException, status

from auth.dependencies import get_current_user, require_api_key
from memory.factory import get_user_store
from models.user import User
from schemas.memory import ClaimDetailResponse, GraphResponse
from services.memory_service import get_claim_detail, get_graph_data

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.get("", response_model=GraphResponse)
def graph(
    current_user: User = Depends(get_current_user),
    api_key: str = Depends(require_api_key),
):
    store = get_user_store(current_user.id, api_key)
    try:
        return get_graph_data(store)
    finally:
        store.db.close()


@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def get_one(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    api_key: str = Depends(require_api_key),
):
    store = get_user_store(current_user.id, api_key)
    try:
        detail = get_claim_detail(store, claim_id)
        if detail is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
        return detail
    finally:
        store.db.close()


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    claim_id: str,
    current_user: User = Depends(get_current_user),
    api_key: str = Depends(require_api_key),
):
    store = get_user_store(current_user.id, api_key)
    try:
        if not store.delete(claim_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    finally:
        store.db.close()
