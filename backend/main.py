# holdmind/backend/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.conversations import router as conversations_router
from routes.memories import router as memories_router
from routes.settings import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Holdmind API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(memories_router)
app.include_router(settings_router)


@app.get("/health")
def health():
    return {"status": "ok"}
