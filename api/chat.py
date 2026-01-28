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

@router.get("")
@router.get("/")
def ping_chat():
    return {"status": "alive", "service": "chat-api", "build": BUILD_ID, "mode": "auth_purged"}

@router.post("")
@router.post("/")
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
        
        # Load Clinical Protocols
        try:
            with open("python_core/clinical_protocols.json", "r") as f:
                protocols = json.load(f)
            protocol_text = json.dumps(protocols, indent=2)
        except Exception as e:
            print(f"Failed to load protocols: {e}")
            protocol_text = "No specific protocols loaded."

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Pluto, a Clinical Assistant. SCOPE: ONLY answer medical, health, or clinical questions. "
                        "If a user asks about non-medical topics (e.g., cooking, coding, general chat), "
                        "return a JSON with response_text politely declining. "
                        f"USER MEDICAL PROFILE:\n{facts_list}\n\n"
                        f"CLINICAL TRIAGE PROTOCOLS (STRICT ADHERENCE REQUIRED):\n{protocol_text}\n\n"
                        "INSTRUCTIONS:\n"
                        "1. CHECK THE PROTOCOLS: If the user mentions a symptom (Headache, Chest Pain, etc.) listed in the protocols, you MUST:\n"
                        "   a. ASK the 'Must-Ask Questions' to gather data before forming a conclusion.\n"
                        "   b. CHECK for 'Red Flags'. If present, escalate.\n"
                        "   c. CHECK for 'Green Flags'. If present, DO NOT ESCALATE to 'Emergency' or 'Seek Care' unnecessarily.\n"
                        "   d. AVOID 'Premature Closure': Do NOT diagnose worst-case scenarios (e.g. Brain Tumor for Headache) without 'Red Flags'.\n"
                        "2. DYNAMIC QUESTION MANAGEMENT:\n"
                        "   a. Analyze the conversation history. If a previous 'follow_up_question' has been answered (completely or partially), REMOVE it from the list.\n"
                        "   b. If the answer is vague, RECURSE or REFINE the question in the list to get more specific context.\n"
                        "   c. If all clinical clarifying questions are answered, the 'follow_up_questions' array should be EMPTY.\n"
                        "3. CLINICAL PIVOT & MULTI-SYSTEM ANALYSIS:\n"
                        "   a. If the conversation shifts (e.g., 'Leg Pain' -> 'Blurry Vision') or if the user describes symptoms across UNRELATED body systems (Multi-System Involvement), you MUST trigger a 'clinical_pivot'.\n"
                        "   b. In the 'clinical_notes' field, provide a structured clinical reasoning block (3-5 sentences). Explain if you suspect a systemic link (e.g., diabetes, inflammation) or if these appear to be independent co-occurring issues.\n"
                        "   c. This note should be the 'Clinical Intelligence' that helps the user understand why unrelated symptoms are being assessed together.\n"
                        "4. Return a JSON object with the following structure:\n"
                        "{\n"
                        "  'response_text': 'Your conversational response here...',\n"
                        "  'updated_analysis': {\n"
                        "      'triage_level': 'Home Care' | 'Seek Care' | 'Emergency',\n"
                        "      'urgency_summary': '...',\n"
                        "      'differential_diagnosis': [{'condition': '...', 'likelihood': '...', 'rationale': '...'}],\n"
                        "      'suggested_focus': ['...'],\n"
                        "      'key_findings': ['...'],\n"
                        "      'follow_up_questions': ['Question 1', 'Question 2'],\n"
                        "      'clinical_notes': 'A structured, detailed clinical analysis if a pivot or multi-system involvement occurs. NEVER return empty if a pivot is detected.'\n"
                        "  }\n"
                        "}"
                    )
                },
                *messages
            ],
            max_tokens=500,
            temperature=0.3,
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
