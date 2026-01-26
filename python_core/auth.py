from fastapi import Header, HTTPException, Depends, Request
import os
from sqlmodel import Session as SQLSession, select
from typing import Optional
from .models import User, Session as UserSession, engine

def get_db_session():
    if engine is None:
        raise HTTPException(
            status_code=500, 
            detail="DATABASE_URL environment variable is missing on Vercel."
        )
    with SQLSession(engine) as session:
        yield session

async def get_current_user(
    request: Request,
    db: SQLSession = Depends(get_db_session)
) -> User:
    """
    Validates a session token from either Header or Cookie.
    Bridges NextAuth session to Vercel Python Function.
    """
    # 1. Try Header
    x_token = request.headers.get("x-session-token")
    
    # 2. Try Cookie (Vercel style)
    if not x_token:
        cookie_header = request.headers.get("cookie", "")
        if "authjs.session-token=" in cookie_header:
            x_token = cookie_header.split("authjs.session-token=")[1].split(";")[0]
        elif "__Secure-authjs.session-token=" in cookie_header:
            x_token = cookie_header.split("__Secure-authjs.session-token=")[1].split(";")[0]

    if not x_token:
        # Fallback for development ENV
        if os.getenv("VERCEL_ENV") != "production":
            x_token = "DEMO_TOKEN"
        else:
            raise HTTPException(status_code=401, detail="Session token required")

    statement = select(UserSession).where(UserSession.sessionToken == x_token)
    session_record = db.exec(statement).first()

    if not session_record:
        if x_token == "DEMO_TOKEN":
            # Return a development fallback user
            stmt = select(User).where(User.email == "mihirmaru1234@gmail.com")
            dev_user = db.exec(stmt).first()
            if dev_user: return dev_user
        raise HTTPException(status_code=401, detail="Invalid session token")

    # Check expiration
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
