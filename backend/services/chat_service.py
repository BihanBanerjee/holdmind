# holdmind/backend/services/chat_service.py
from typing import Generator

from openai import OpenAI
from recollectx.claims import Claim, EpisodicClaim, SemanticClaim

from memory.factory import get_extractor, get_updater, get_user_store
from services.pattern_service import format_patterns_for_prompt

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
_DEFAULT_CHAT_MODEL = "anthropic/claude-sonnet-4-5"
_RELEVANT_K = 5


def claim_to_text(claim: Claim) -> str:
    if isinstance(claim, SemanticClaim):
        return f"{claim.subject} {claim.predicate} {claim.object}"
    if isinstance(claim, EpisodicClaim):
        return claim.summary
    return ""


def build_system_prompt(relevant_claims: list[Claim], patterns: dict | None = None) -> str:
    """Build the system prompt with optional memory context and user style patterns."""
    preamble = (
        "CRITICAL RULE: Your responses must contain ONLY natural conversational text. "
        "NEVER include XML tags, memory operations, internal formatting, or structured data "
        "like <memory_update>, <add>, <delete>, <remove>, or similar in your responses. "
        "Memory management happens automatically behind the scenes — do not reference it.\n\n"
    )

    if relevant_claims:
        memory_lines = "\n".join(
            f"- [{c.type}] {claim_to_text(c)}" for c in relevant_claims
        )
        base = (
            preamble
            + "You are Holdmind, a helpful AI assistant with persistent memory.\n\n"
            "You know the following about this user:\n"
            f"{memory_lines}\n\n"
            "Use this context naturally in your responses when relevant. "
            "Do not mention that you have a memory system."
        )
    else:
        base = (
            preamble
            + "You are Holdmind, a helpful AI assistant. "
            "You will store things the user tells you over time."
        )

    if patterns:
        style_hint = format_patterns_for_prompt(patterns)
        if style_hint:
            base += f"\n\n{style_hint}"

    return base


def stream_response(
    messages: list[dict],
    api_key: str,
    model: str = _DEFAULT_CHAT_MODEL,
) -> Generator[str, None, None]:
    """Stream an OpenRouter chat response, yielding text chunks."""
    client = OpenAI(api_key=api_key, base_url=_OPENROUTER_BASE_URL)
    stream = client.chat.completions.create(model=model, messages=messages, stream=True)
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def get_relevant_memories(user_id: str, api_key: str, query: str) -> list[Claim]:
    """Retrieve semantically relevant memories for a query."""
    store = get_user_store(user_id, api_key)
    return store.semantic_query(query, k=_RELEVANT_K, recency_bias=0.1)


def extract_and_store(
    user_message: str,
    ai_response: str,
    user_id: str,
    api_key: str,
    store=None,  # optional pre-built store to avoid double initialization
) -> list[dict]:
    """Extract claims from conversation turn and store via MemoryUpdater."""
    combined = f"User: {user_message}\nAssistant: {ai_response}"
    if store is None:
        store = get_user_store(user_id, api_key)
    extractor = get_extractor(api_key)
    updater = get_updater(store, api_key)

    claims = extractor.extract(combined)
    results = []
    for claim in claims:
        updater.process(claim)
        results.append({
            "id": claim.id,
            "type": claim.type,
            "text": claim_to_text(claim),
            "confidence": claim.confidence,
        })
    return results
