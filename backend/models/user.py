import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    openrouter_key_enc = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
