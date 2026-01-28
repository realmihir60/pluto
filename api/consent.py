from typing import Optional
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine
from python_core.auth import get_current_user_optional, get_db_session

router = APIRouter()

import traceback

from sqlmodel import select, func

BUILD_ID = "v2.6.4-final-handshake"

@router.get("")
@router.get("/")
def ping(db: Session = Depends(get_db_session)):
    try:
        count = db.exec(select(func.count()).select_from(User)).one()
        return {
            "status": "alive", 
            "service": "consent-api", 
            "build": BUILD_ID,
            "db_connected": engine is not None,
            "user_count": count
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@router.post("")
@router.post("/")
async def update_consent(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    try:
        if user:
            user.has_consented = True
            db.add(user)
            db.commit()
        return {"success": True}
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Consent Error:\n{error_info}")
        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "traceback": error_info
        })

# Vercel Serverless Handler - Correct Format
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Router module for Master Router
