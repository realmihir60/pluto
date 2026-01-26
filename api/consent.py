import os
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine
from python_core.auth import get_current_user, get_db_session

app = FastAPI()

@app.get("/api/consent")
def ping():
    return {"status": "alive", "service": "consent-api"}

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
        raise HTTPException(status_code=500, detail=str(e))
