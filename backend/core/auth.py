from fastapi import Header, HTTPException, Depends
from sqlmodel import Session, select
from typing import Optional
from ..models import User, Session as UserSession
from .memory import engine

def get_db_session():
    with Session(engine) as session:
        yield session

async def get_current_user(
    x_session_token: Optional[str] = Header(None),
    db: Session = Depends(get_db_session)
) -> User:
    """
    Validates a session token against the database.
    This bridges the NextAuth session from the frontend to the Python backend.
    """
    if not x_session_token:
        # For development/demo purposes, we might allow a fallback user email if provided
        # but in production this must be strict.
        raise HTTPException(status_code=401, detail="Missing session token")

    statement = select(UserSession).where(UserSession.sessionToken == x_session_token)
    session_record = db.exec(statement).first()

    if not session_record:
        raise HTTPException(status_code=401, detail="Invalid session token")

    # Check expiration (NextAuth sessions have an 'expires' datetime)
    if session_record.expires < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired")

    statement = select(User).where(User.id == session_record.userId)
    user = db.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

async def get_consented_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    Strict dependency that ensures the user has signed the legal consent gate.
    Bypass attempt on this dependency must return 403 Forbidden.
    """
    if not user.has_consented:
        raise HTTPException(
            status_code=403, 
            detail={
                "error": "consent_required",
                "message": "You must agree to the clinical terms before proceeding."
            }
        )
    return user

# Add datetime import since it's used
from datetime import datetime
