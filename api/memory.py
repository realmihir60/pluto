import os
import json
import openai
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, MedicalFact, engine
from python_core.auth import get_current_user, get_db_session

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@app.get("/api/memory")
def ping_memory():
    return {"status": "alive", "service": "memory-api"}

@app.post("/")
@app.post("/api/memory")
async def extract_memory(
    request: Request, 
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    try:
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
                userId=user.id,
                type=fact.get("type"),
                value=fact.get("value"),
                source="Vercel Memory Extraction"
            )
            db.add(new_fact)
        
        db.commit()
        return {"success": True, "count": len(facts_data)}

    except Exception as e:
        print(f"Memory Error: {e}")
        return {"error": str(e)}
