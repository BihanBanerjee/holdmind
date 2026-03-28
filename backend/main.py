# holdmind/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.conversations import router as conversations_router

app = FastAPI(title="Holdmind API")

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
