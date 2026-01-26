import os
import traceback
from datetime import datetime
from fastapi import Header, HTTPException, Depends, Request
from sqlmodel import Session as SQLSession, select
from typing import Optional
from .models import User, Session as UserSession, engine

def get_db_session():
    if engine is None:
        raise HTTPException(
            status_code=500, 
            detail="DATABASE_URL environment variable is missing or malformed on Vercel."
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
    try:
        # 1. Try Header
        x_token = request.headers.get("x-session-token")
        
        # 2. Try Cookie (Vercel style)
        if not x_token:
            cookie_header = request.headers.get("cookie", "")
            # Common NextAuth/Auth.js cookie names
            potential_keys = [
                "authjs.session-token=", 
                "__Secure-authjs.session-token=",
                "next-auth.session-token=",
                "__Secure-next-auth.session-token="
            ]
            for key in potential_keys:
                if key in cookie_header:
                    x_token = cookie_header.split(key)[1].split(";")[0]
                    break

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
    except HTTPException:
        raise
    except Exception as e:
        error_info = traceback.format_exc()
        raise HTTPException(status_code=500, detail={
            "error": f"Auth Bridge Crash: {str(e)}",
            "traceback": error_info
        })

async def get_consented_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    Strict dependency that ensures the user has signed the legal consent gate.
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
