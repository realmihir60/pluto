from typing import Optional
import os
import json
import openai
import traceback
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_core.models import User, engine, MedicalFact
from python_core.auth import get_current_user_optional, get_db_session

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@router.post("")
@router.post("/")
async def chat_endpoint(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        body = await request.json()
        messages = body.get("messages", [])
        
        # Inject clinical persona
        system_msg = {
            "role": "system",
            "content": "You are Dr. Pluto, a helpful and reassuring medical AI. Use simple, non-technical language. Always advise seeking professional help for serious symptoms."
        }
        
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[system_msg] + messages,
            temperature=0.7
        )
        
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
