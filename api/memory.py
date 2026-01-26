import os
import json
import openai
import traceback
from typing import Optional # Added for Optional type hint
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, MedicalFact, engine
from python_core.auth import get_current_user_optional, get_db_session # Changed get_current_user to get_current_user_optional

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v2.6.3-route-fix"

@app.get("/")
def ping_memory():
    return {"status": "alive", "service": "memory-api", "build": BUILD_ID, "mode": "auth_purged"}

@app.post("/")
async def extract_memory(
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional), # Changed to Optional[User] and get_current_user_optional
    db: Session = Depends(get_db_session)
):
    try:
        if not user: return {"facts": [], "status": "anonymous_mode"} # Added check for anonymous mode
        
        data = await request.json()
        text = data.get("text")
        
        if not GROQ_API_KEY: return {"facts": []}

        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Extract chronic conditions, medications, and allergies in JSON format."},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        result = json.loads(completion.choices[0].message.content)
        facts_data = result.get("facts", [])
        
        for fact in facts_data:
            new_fact = MedicalFact(
                id=f"fact_{os.urandom(4).hex()}",
                userId=user.id,
                type=fact.get("type"),
                value=fact.get("value"),
                source="Vercel Memory Extraction"
            )
            db.add(new_fact)
        
        db.commit()
        return {"success": True, "count": len(facts_data)}

    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Vercel Memory Error: {error_info}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_info})
