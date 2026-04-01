# holdmind/backend/routes/chat.py
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_api_key
from database import get_db
from limiter import limiter
from memory.factory import get_user_store
from models.user import User
from schemas.chat import ChatRequest
from services.chat_service import (
    build_system_prompt,
    extract_and_store,
    stream_response,
)
from services.conversation_service import get_conversation, save_messages, auto_title_conversation
from services.pattern_service import get_user_patterns, update_user_patterns

_logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["chat"])


@router.post("/{conversation_id}/chat")
@limiter.limit("20/minute")
def chat(
    request: Request,
    conversation_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    api_key: str = Depends(require_api_key),
    db: Session = Depends(get_db),
):
    conv = get_conversation(db, conversation_id, current_user.id)
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    def generate():
        try:
            store = get_user_store(current_user.id, api_key)
            relevant = store.semantic_query(body.message, k=5, recency_bias=0.1)
            patterns = get_user_patterns(db, current_user.id)
            system_prompt = build_system_prompt(relevant, patterns)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": body.message},
            ]
            full_response = ""
            for chunk in stream_response(messages, api_key, model=body.model):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            try:
                claims = extract_and_store(
                    user_message=body.message,
                    ai_response=full_response,
                    user_id=current_user.id,
                    api_key=api_key,
                    store=store,
                )
            except Exception as extract_err:
                claims = []
                _logger.error("Claim extraction failed: %s", extract_err)
            try:
                save_messages(db, conversation_id, body.message, full_response, claims)
                auto_title_conversation(db, conversation_id, current_user.id, body.message)
            except Exception as post_err:
                _logger.error("Post-stream processing failed: %s", post_err)
            try:
                update_user_patterns(db, current_user.id)
            except Exception as pattern_err:
                _logger.warning("Pattern update failed (non-critical): %s", pattern_err)
            yield f"data: {json.dumps({'type': 'claims', 'data': claims})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
