import os
import json
import openai
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, engine, MedicalFact
from python_core.auth import get_consented_user, get_db_session

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Memory extraction for Chat history"""
    if not GROQ_API_KEY: return
    try:
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
            db.add(MedicalFact(userId=user_id, type=fact['type'], value=fact['value'], source="Chat Extraction"))
        db.commit()
    except Exception as e:
        print(f"Chat Memory Sync Error: {e}")

@app.post("/api/chat")
async def post_chat(
    request: Request, 
    user: User = Depends(get_consented_user),
    db: Session = Depends(get_db_session)
):
    try:
        data = await request.json()
        messages = data.get("messages")
        
        if not GROQ_API_KEY:
            raise HTTPException(status_code=503, detail="Chat unavailable (No API Key).")

        # Fetch medical facts
        facts = user.medical_facts
        facts_list = "\n".join([f"- {f.type}: {f.value}" for f in facts])

        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"You are Pluto, a Medical Assistant. Known Medical Profile:\n{facts_list}"
                },
                *messages
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        content = completion.choices[0].message.content
        
        # Background Memory Sync
        if messages:
            last_user_msg = messages[-1].get("content", "")
            await extract_and_save_facts(user.id, last_user_msg, db)

        return {"role": "assistant", "content": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
