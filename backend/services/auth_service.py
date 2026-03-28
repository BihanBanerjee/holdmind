# holdmind/backend/services/auth_service.py
from sqlalchemy.orm import Session

from auth.password import hash_password, verify_password
from models.user import User


def create_user(db: Session, email: str, password: str) -> User:
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already registered")
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    return user


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)
