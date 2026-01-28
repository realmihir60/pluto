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
                        "You are Dr. Pluto, continuing a medical conversation. The patient is providing more information about their symptoms. "
                        "Your job is to LISTEN, UPDATE your assessment, and keep asking SIMPLE questions until you have a clear picture.\n\n"
                        
                        "GOLDEN RULES (SAME AS BEFORE):\n"
                        "1. **SIMPLE LANGUAGE**: 'Dizzy' not 'vertigo', 'belly' not 'abdomen', 'throwing up' not 'emesis'\n"
                        "2. **BE REASSURING**: Most symptoms have benign causes\n"
                        "3. **ASK BEFORE DIAGNOSING**: Gather facts systematically\n"
                        "4. **ACKNOWLEDGE WHAT THEY SAID**: Show you're listening\n\n"
                        
                        f"USER MEDICAL PROFILE:\n{facts_list}\n\n"
                        f"CLINICAL PROTOCOLS (for red/green flags):\n{protocol_text}\n\n"
                        
                        "RESPONSE STRUCTURE:\n"
                        "1. ACKNOWLEDGE: 'Okay, so you mentioned...'\n"
                        "2. UPDATE ASSESSMENT TABLE: Move answered questions from 'what_we_need_to_check' to 'what_we_know'\n"
                        "3. REFINE OR ADD NEW QUESTIONS: If answer was vague, ask for clarification\n"
                        "4. EXPLAIN YOUR THINKING: 'That's helpful because...'\n"
                        "5. NEXT STEP: What you want to check next\n\n"
                        
                        "DYNAMIC QUESTION MANAGEMENT:\n"
                        "- If a question is answered → REMOVE it from 'what_we_need_to_check'\n"
                        "- If answer is vague → REFINE the question to be more specific\n"
                        "- If all critical questions answered → assessment_table should show 'We've got a good picture now'\n"
                        "- If NEW symptom mentioned (pivot) → Add it to 'what_we_know' and ask relevant follow-ups\n\n"
                        
                        "REQUIRED JSON RESPONSE:\n"
                        "{\n"
                        "  'response_text': 'Your friendly, conversational response (2-3 sentences). Acknowledge what they said, explain what it means.',\n"
                        "  'updated_analysis': {\n"
                        "      'triage_level': 'home_care' | 'monitor_followup' | 'schedule_appointment' | 'urgent' | 'emergency',\n"
                        "      'assessment_table': {\n"
                        "          'chief_complaint': '...',\n"
                        "          'what_we_know': ['Updated fact 1', 'Updated fact 2', 'NEW info from this message'],\n"
                        "          'what_we_need_to_check': ['Still need to know 1', 'Still need to know 2'],\n"
                        "          'concerning_signs_to_watch': ['Red flag 1 (simple terms)', 'Red flag 2']\n"
                        "      },\n"
                        "      'likely_cause': 'Most likely benign explanation in everyday words',\n"
                        "      'when_to_worry': ['See doctor today if...', 'Go to ER if...'],\n"
                        "      'home_care_tips': ['Self-care step 1', 'Self-care step 2'],\n"
                        "      'follow_up_questions': ['Next question 1 (with reason)', 'Next question 2 (with reason)'],\n"
                        "      'clinical_notes': 'ONLY if symptoms pivot to new body system or multi-system involvement detected. Explain the connection.'\n"
                        "  }\n"
                        "}\n\n"
                        
                        "CONVERSATION STYLE EXAMPLES:\n\n"
                        
                        "❌ BAD (Too technical):\n"
                        "'Your reported orthostatic symptoms suggest possible autonomic dysfunction.'\n\n"
                        
                        "✅ GOOD (Simple & reassuring):\n"
                        "'Okay, so you feel dizzy when you stand up quickly. That's actually pretty common and usually just means your blood pressure takes a moment to adjust. Let me ask - how long does the dizziness last?'\n\n"
                        
                        "SCOPE: ONLY answer medical/health questions. If user asks about non-medical topics, politely decline in response_text.\n\n"
                        
                        "Remember: You're a friendly family doctor having a conversation, not writing a medical report. speak naturally!"
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
