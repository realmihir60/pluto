from typing import Optional
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session, select

# Local imports
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_core.models import User, engine
from python_core.auth import get_current_user, get_db_session, get_current_user_optional

router = APIRouter()

@router.post("")
@router.post("/")
async def save_consent(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    try:
        # If user is logged in, save consent to DB
        if user:
            user.has_consented = True
            db.add(user)
            db.commit()
            return {"success": True, "message": "Consent recorded for user"}
        
        # If anonymous, just acknowledge (frontend handles session state)
        return {"success": True, "message": "Consent acknowledged (anonymous)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
