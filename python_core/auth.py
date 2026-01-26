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

async def get_current_user(
    request: Request,
    db: SQLSession = Depends(get_db_session)
) -> User:
    """
    Robust JWT Bridge for NextAuth v5 to Python Serverless.
    Uses python-jose which handles NextAuth's token format correctly.
    """
    if not AUTH_SECRET:
        raise HTTPException(status_code=500, detail="AUTH_SECRET not configured on server.")

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
            print(f"DEBUG_AUTH: Found session token in cookie: {key}")
            break

    if not token:
        # Fallback for local development headers
        token = request.headers.get("x-session-token")
        if token:
            print("DEBUG_AUTH: Using token from x-session-token header")

    if not token:
        raise HTTPException(
            status_code=401, 
            detail={
                "code": "MISSING_TOKEN", 
                "message": "No session token found in cookies or headers.",
                "cookies_found": list(cookies.keys())
            }
        )

    # 2. Verify JWT Signature and Claims
    try:
        # python-jose handles NextAuth's specific JWT implementation
        payload = jwt.decode(
            token, 
            AUTH_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "verify_aud": False,  # NextAuth doesn't always set audience
                "leeway": JWT_LEEWAY
            }
        )
        
        # Extract user ID from token
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "INVALID_PAYLOAD", 
                    "message": "Token is valid but missing User ID claim.",
                    "payload_keys": list(payload.keys())
                }
            )

        print(f"DEBUG_AUTH: Successfully decoded JWT for user: {user_id}")

        # 3. Retrieve User from Database
        statement = select(User).where(User.id == user_id)
        user = db.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "USER_NOT_FOUND", 
                    "message": f"Verified user session refers to non-existent user: {user_id}"
                }
            )

        return user

    except JWTError as e:
        # python-jose specific errors
        error_type = type(e).__name__
        if "expired" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "TOKEN_EXPIRED", 
                    "message": "Your session has expired. Please log in again."
                }
            )
        elif "signature" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "INVALID_SIGNATURE", 
                    "message": "Token signature verification failed.",
                    "hint": "Ensure AUTH_SECRET matches between NextAuth and Python."
                }
            )
        else:
            raise HTTPException(
                status_code=401, 
                detail={
                    "code": "JWT_ERROR", 
                    "message": f"JWT verification failed: {str(e)}",
                    "error_type": error_type
                }
            )
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"DEBUG_AUTH: Unexpected error: {error_info}")
        raise HTTPException(
            status_code=500, 
            detail={
                "code": "INTERNAL_AUTH_ERROR", 
                "message": f"Unexpected auth bridge failure: {str(e)}",
                "traceback": error_info
            }
        )

async def get_consented_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    Enforces the clinical consent gate after identity is verified.
    """
    if not user.has_consented:
        raise HTTPException(
            status_code=403, 
            detail={
                "error": "consent_required",
                "message": "Clinical safety terms must be agreed to before using this tool."
            }
        )
    return user
