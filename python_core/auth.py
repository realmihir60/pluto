import os
import jwt
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
    Validates signature, expiration, and provides detailed error taxonomy.
    """
    if not AUTH_SECRET:
        raise HTTPException(status_code=500, detail="AUTH_SECRET not configured on server.")

    # 1. Extract Token from Cookies
    cookie_header = request.headers.get("cookie", "")
    token = None
    
    # Priority order for session cookies
    cookie_keys = [
        "__Secure-authjs.session-token",
        "authjs.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.session-token"
    ]
    
    cookies = {c.split('=')[0].strip(): c.split('=')[1].strip() for c in cookie_header.split(';') if '=' in c}
    
    for key in cookie_keys:
        if key in cookies:
            token = cookies[key]
            break

    if not token:
        # Fallback for local development headers
        token = request.headers.get("x-session-token")

    if not token:
        raise HTTPException(
            status_code=401, 
            detail={"code": "MISSING_TOKEN", "message": "No session token found in cookies or headers."}
        )

    # 2. Verify JWT Signature and Claims
    try:
        # Note: NextAuth v5 uses 'jose' with a specific salt/secret derivation 
        # for JWE encryption by default. If using JWS (signing only), this works directly.
        payload = jwt.decode(
            token, 
            AUTH_SECRET, 
            algorithms=[JWT_ALGORITHM],
            leeway=JWT_LEEWAY
        )
        
        user_id = payload.get("id") or payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail={"code": "INVALID_PAYLOAD", "message": "Token is valid but missing User ID claim."}
            )

        # 3. Retrieve User from Database
        # We use 'userId' (lowercase i) to match normalized schema
        statement = select(User).where(User.id == user_id)
        user = db.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=401, 
                detail={"code": "USER_NOT_FOUND", "message": "Verified user session refers to a non-existent user."}
            )

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, 
            detail={"code": "TOKEN_EXPIRED", "message": "Your session has expired. Please log in again."}
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=401, 
            detail={"code": "INVALID_SIGNATURE", "message": "Tampered or incorrectly signed session token."}
        )
    except jwt.DecodeError:
        # This often happens if the token is encrypted (JWE) instead of signed (JWS)
        raise HTTPException(
            status_code=401, 
            detail={
                "code": "DECODE_ERROR", 
                "message": "Could not decode session token. Ensure HS256 signing is used."
            }
        )
    except Exception as e:
        error_info = traceback.format_exc()
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
