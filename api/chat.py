from typing import Optional
import os
import json
import openai
import traceback
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine, MedicalFact
from python_core.auth import get_current_user_optional, get_db_session

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v2.6.4-final-handshake"

async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Memory extraction for Chat history"""
    if not GROQ_API_KEY: return
    try:
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Extract permanent medical facts (Conditions, Meds, Allergies) in JSON: {'facts': [{'type':'...','value':'...'}]}"},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        res = json.loads(completion.choices[0].message.content)
        for fact in res.get("facts", []):
            db.add(MedicalFact(id=f"fact_{os.urandom(4).hex()}", userId=user_id, type=fact['type'], value=fact['value'], source="Chat Extraction"))
        db.commit()
    except Exception as e:
        print(f"Fact Extraction Error: {e}")

@router.get("")
@router.get("/")
def ping():
    return {"status": "alive", "service": "chat-api", "build": BUILD_ID, "mode": "anonymous_ok"}

@router.post("")
@router.post("/")
async def run_chat(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    try:
        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail={"error": "GROQ_API_KEY not found"})
        
        data = await request.json()
        messages = data.get("messages", [])
        
        if user:
            facts = db.query(MedicalFact).filter(MedicalFact.userId == user.id).all()
            memory_context = "\n".join([f"- {f.type}: {f.value}" for f in facts]) if facts else "None"
        else:
            memory_context = "None"
        
        system_msg = {
            "role": "system",
            "content": f"""You are Pluto, a clinical AI assistant. The user's known medical history is: {memory_context}.
            
Based on their latest question, generate a JSON response with:
- "response": Clinical answer (2-3 sentences, empathetic, plain language)
- "follow_up_questions": Array of 2-3 relevant clarifying questions (only if needed)

Keep answers conservative and always suggest professional evaluation for concerning symptoms."""
        }
        
        full_messages = [system_msg] + messages
        
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=full_messages,
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        content_str = completion.choices[0].message.content
        content_json = json.loads(content_str)
        
        # Background Memory Sync
        if messages and user:
            last_user_msg = messages[-1].get("content", "")
            await extract_and_save_facts(user.id, last_user_msg, db)

        return content_json

    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Vercel Chat Error: {error_info}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_info})

# Vercel Serverless Handler - Correct Format
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicit prefix for Vercel routing
app.include_router(router, prefix="/api/chat")

# This is what Vercel invokes
handler = Mangum(app, lifespan="off")
