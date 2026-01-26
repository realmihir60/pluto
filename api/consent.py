import os
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine
from python_core.auth import get_current_user, get_db_session

app = FastAPI()

import traceback

from sqlmodel import select, func

BUILD_ID = "v2.5.2-ULTIMATE-RECOVERY"

@app.get("/api/consent")
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
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.post("/")
@app.post("/api/consent")
async def update_consent(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    try:
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
