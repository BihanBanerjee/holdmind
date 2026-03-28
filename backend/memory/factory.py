# holdmind/backend/memory/factory.py
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from recollectx.db.database import Base
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


def _make_db_session(db_path: str) -> Session:
    """Create a fresh SQLAlchemy session bound to a specific SQLite file.

    Bypasses recollectx's module-level global engine/sessionmaker singleton,
    which would silently reuse the first-ever db_path for all subsequent calls.
    """
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    import recollectx.db.models  # noqa: F401 — register ORM models with Base
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autoflush=False, autocommit=False, bind=engine)()


def get_user_store(user_id: str, api_key: str) -> MemoryStore:
    """Create a per-user MemoryStore (SQLite + Qdrant).

    Each user gets an isolated SQLite file and a scoped Qdrant collection.
    Caller is responsible for closing the underlying DB session when done.
    """
    db_dir = settings.memory_db_dir
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, f"{user_id}.db")

    db = _make_db_session(db_path)
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
