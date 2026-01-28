import os
import json
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session, select

# Local imports
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_core.models import User, MedicalFact, engine
from python_core.auth import get_current_user, get_db_session

router = APIRouter()

@router.get("")
@router.get("/")
async def get_memory(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    try:
        statement = select(MedicalFact).where(MedicalFact.userId == user.id)
        facts = db.exec(statement).all()
        return {"facts": facts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
