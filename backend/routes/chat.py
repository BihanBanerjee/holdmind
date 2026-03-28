# holdmind/backend/routes/chat.py
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_api_key
from database import get_db
from memory.factory import get_user_store
from models.user import User
from schemas.chat import ChatRequest
from services.chat_service import (
    build_system_prompt,
    extract_and_store,
    stream_response,
)
from services.conversation_service import get_conversation, save_messages

_logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["chat"])


@router.post("/{conversation_id}/chat")
def chat(
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
            # 1. Retrieve relevant memories (creates store once)
            store = get_user_store(current_user.id, api_key)
            relevant = store.semantic_query(body.message, k=5, recency_bias=0.1)

            # 2. Build messages for LLM
            system_prompt = build_system_prompt(relevant)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": body.message},
            ]

            # 3. Stream response
            full_response = ""
            for chunk in stream_response(messages, api_key, model=body.model):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            # 4. Extract + store claims (wrapped independently so streaming failure is separate)
            try:
                claims = extract_and_store(
                    user_message=body.message,
                    ai_response=full_response,
                    user_id=current_user.id,
                    api_key=api_key,
                    store=store,
                )
                save_messages(db, conversation_id, body.message, full_response)
            except Exception as post_err:
                claims = []
                # Log but don't abort — the conversation text was already streamed
                _logger.error("Post-stream processing failed: %s", post_err)

            # 5. Send extracted claims + done signal
            yield f"data: {json.dumps({'type': 'claims', 'data': claims})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
