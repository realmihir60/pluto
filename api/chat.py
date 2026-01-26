from typing import Optional
import os
import json
import openai
import traceback
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine, MedicalFact
from python_core.auth import get_current_user_optional, get_db_session

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v2.6.4-final-handshake"

async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Memory extraction for Chat history"""
    if not GROQ_API_KEY: return
    try:
        if user_id == "anonymous": return # Don't save for anonymous
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Extract permanent medical facts (Conditions, Meds, Allergies) in JSON. Return {'facts': []} if none."},
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
        print(f"Chat Memory Sync Error: {e}")

@app.get("/")
@app.get("/api/chat")
def ping_chat():
    return {"status": "alive", "service": "chat-api", "build": BUILD_ID, "mode": "auth_purged"}

@app.post("/")
@app.post("/api/chat")
async def post_chat(
    request: Request, 
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    try:
        data = await request.json()
        messages = data.get("messages")
        
        if not GROQ_API_KEY:
            raise HTTPException(status_code=503, detail="Chat unavailable (No API Key).")

        # Fetch medical facts (if authenticated)
        facts_list = ""
        user_id = "anonymous"
        if user:
            user_id = user.id
            facts = user.medicalFacts
            facts_list = "\n".join([f"- {f.type}: {f.value}" for f in facts])

        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Pluto, a Clinical Assistant. SCOPE: ONLY answer medical, health, or clinical questions. "
                        "If a user asks about non-medical topics (e.g., cooking, coding, general chat), "
                        "politely say: 'I apologize, but I am programmed to only assist with medical and health-related inquiries.' "
                        f"USER MEDICAL PROFILE:\n{facts_list}"
                    )
                },
                *messages
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        content = completion.choices[0].message.content
        
        # Background Memory Sync
        if messages and user:
            last_user_msg = messages[-1].get("content", "")
            await extract_and_save_facts(user.id, last_user_msg, db)

        return {"role": "assistant", "content": content}

    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Vercel Chat Error: {error_info}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_info})
