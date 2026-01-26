import os
from jose import jwt, JWTError
import traceback
from datetime import datetime, timezone
from fastapi import Header, HTTPException, Depends, Request
from sqlmodel import Session as SQLSession, select
from typing import Optional
from .models import User, engine

# Hardened Configuration
AUTH_SECRET = os.getenv("AUTH_SECRET")
JWT_ALGORITHM = "HS256"
JWT_LEEWAY = 30  # 30 seconds for clock skew

def get_db_session():
    if engine is None:
        raise HTTPException(
            status_code=500, 
            detail="DATABASE_URL environment variable is missing or malformed."
        )
    with SQLSession(engine) as session:
        yield session

async def get_current_user_optional(
    request: Request,
    db: SQLSession = Depends(get_db_session)
) -> Optional[User]:
    """
    Optional JWT verification - returns User if authenticated, None if anonymous.
    Used for endpoints that work both authenticated and anonymous.
    """
    if not AUTH_SECRET:
        return None  # Allow anonymous if no secret configured

    # 1. Extract Token from Cookies
    cookie_header = request.headers.get("cookie", "")
    token = None
    
    # Priority order for session cookies (NextAuth v5)
    cookie_keys = [
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "next-auth.session-token",
        "__Secure-next-auth.session-token"
    ]
    
    # Parse cookies safely
    cookies = {}
    for cookie in cookie_header.split(';'):
        cookie = cookie.strip()
        if '=' in cookie:
            key, value = cookie.split('=', 1)
            cookies[key.strip()] = value.strip()
    
    for key in cookie_keys:
        if key in cookies:
            token = cookies[key]
            break

    if not token:
        # No token found - allow anonymous access
        return None

    # 2. Verify JWT if token exists
    try:
        payload = jwt.decode(
            token, 
            AUTH_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_aud": False,
                "leeway": JWT_LEEWAY
            }
        )
        
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            return None  # Invalid token, allow anonymous

        # 3. Retrieve User from Database
        statement = select(User).where(User.id == user_id)
        user = db.exec(statement).first()
        
        return user  # May be None if user deleted

    except JWTError:
        # Token invalid - allow anonymous rather than failing
        return None
    except Exception:
        # Unexpected error - allow anonymous
        return None

async def get_current_user(
    request: Request,
    db: SQLSession = Depends(get_db_session)
) -> User:
    """
    Strict JWT verification - raises 401 if not authenticated.
    Use for endpoints that require authentication.
    """
    if not AUTH_SECRET:
        raise HTTPException(status_code=500, detail="AUTH_SECRET not configured on server.")

    # Extract Token
    cookie_header = request.headers.get("cookie", "")
    token = None
    
    cookie_keys = [
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "next-auth.session-token",
        "__Secure-next-auth.session-token"
    ]
    
    cookies = {}
    for cookie in cookie_header.split(';'):
        cookie = cookie.strip()
        if '=' in cookie:
            key, value = cookie.split('=', 1)
            cookies[key.strip()] = value.strip()
    
    for key in cookie_keys:
        if key in cookies:
            token = cookies[key]
            print(f"DEBUG_AUTH: Found session token in cookie: {key}")
            break

    if not token:
        raise HTTPException(
            status_code=401, 
            detail={
                "code": "MISSING_TOKEN", 
                "message": "No session token found. Please log in.",
                "cookies_found": list(cookies.keys())
            }
        )

    # Verify JWT
    try:
        payload = jwt.decode(
            token, 
            AUTH_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_aud": False,
                "leeway": JWT_LEEWAY
            }
        )
        
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "INVALID_PAYLOAD", 
                    "message": "Token is valid but missing User ID."
                }
            )

        statement = select(User).where(User.id == user_id)
        user = db.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=401, 
                detail={"code": "USER_NOT_FOUND", "message": "User not found in database."}
            )

        return user

    except JWTError as e:
        if "expired" in str(e).lower():
            raise HTTPException(status_code=401, detail={"code": "TOKEN_EXPIRED", "message": "Session expired. Please log in again."})
        elif "signature" in str(e).lower():
            raise HTTPException(status_code=401, detail={"code": "INVALID_SIGNATURE", "message": "Invalid token signature."})
        else:
            raise HTTPException(status_code=401, detail={"code": "JWT_ERROR", "message": f"JWT error: {str(e)}"})
    except HTTPException:
        raise
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"DEBUG_AUTH: Unexpected error: {error_info}")
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_AUTH_ERROR", "message": str(e)})

async def get_consented_user(
    user: User = Depends(get_current_user)
) -> User:
    """Enforces consent requirement (for authenticated users only)"""
    if not user.has_consented:
        raise HTTPException(
            status_code=403, 
            detail={"error": "consent_required", "message": "Please agree to clinical terms."}
        )
    return user
