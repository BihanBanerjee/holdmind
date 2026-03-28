# holdmind/backend/memory/factory.py
import os

from recollectx.db.database import SessionLocal, create_tables
from recollectx.extractors.llm import LLMExtractor
from recollectx.llm.providers.openrouter import OpenRouterProvider
from recollectx.storage.memory_store import MemoryStore
from recollectx.storage.vector.qdrant import QdrantBackend
from recollectx.updater import MemoryUpdater

from config import settings

_EMBEDDING_DIMENSION = 1536  # openai/text-embedding-3-small via OpenRouter
_CHAT_MODEL = "anthropic/claude-sonnet-4-5"


def _make_provider(api_key: str) -> OpenRouterProvider:
    return OpenRouterProvider(
        api_key=api_key,
        model=_CHAT_MODEL,
        embedding_model="openai/text-embedding-3-small",
        app_name="holdmind",
    )


def get_user_store(user_id: str, api_key: str) -> MemoryStore:
    """Create a per-user MemoryStore (SQLite + Qdrant)."""
    db_dir = settings.memory_db_dir
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, f"{user_id}.db")

    create_tables(db_path)
    db = SessionLocal(db_path)

    provider = _make_provider(api_key)

    vectors = QdrantBackend(
        url=settings.qdrant_url,
        collection_name=f"beliefs_{user_id}",
        embedding_fn=provider.embed,
        dimension=_EMBEDDING_DIMENSION,
        api_key=settings.qdrant_api_key,
        distance="cosine",
    )

    return MemoryStore(db=db, vectors=vectors)


def get_extractor(api_key: str) -> LLMExtractor:
    """Create an LLMExtractor using the user's OpenRouter key."""
    provider = _make_provider(api_key)
    return LLMExtractor(llm_provider=provider, min_confidence=0.5)


def get_updater(store: MemoryStore, api_key: str) -> MemoryUpdater:
    """Create a MemoryUpdater for intelligent claim deduplication."""
    provider = _make_provider(api_key)
    return MemoryUpdater(store=store, llm=provider, similarity_k=5)
