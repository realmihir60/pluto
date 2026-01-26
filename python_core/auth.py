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
    PERMISSIVE TESTING MODE: 
    Returns the account owner (mihirmaru1234@gmail.com) instantly.
    This scraps Auth enforcement to unblock clinical development.
    """
    try:
        # We look for the main user in the database
        owner_email = "mihirmaru1234@gmail.com"
        statement = select(User).where(User.email == owner_email)
        user = db.exec(statement).first()
        
        if not user:
            # Fallback if DB is empty: create a shadow test user
            user = User(
                id="test_user_alpha",
                email=owner_email,
                name="Pluto Tester",
                has_consented=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return user
    except Exception as e:
        print(f"Permissive Auth Error: {e}")
        # Final safety fallback to avoid any 500s
        return User(id="fallback", email="test@pluto.ai", has_consented=True)

async def get_consented_user(
    user: User = Depends(get_current_user)
) -> User:
    """Bypasses consent requirement in Testing Mode."""
    return user
