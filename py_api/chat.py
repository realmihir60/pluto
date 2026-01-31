from typing import Optional, List, Dict
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
from python_core.clinical_reasoning_engine import get_reasoning_engine, UrgencyLevel

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
        
        # 1. Extract conversation to get latest input and history
        if not messages:
            return {"response_text": "I didn't quite catch that. Could you repeat?"}
            
        last_user_msg = messages[-1]["content"]
        # Convert previous messages to string history for the engine
        # Filter only user messages for the reasoning history
        history_text = [m["content"] for m in messages[:-1] if m["role"] == "user"]
        
        # 2. Re-run Clinical Reasoning Engine with new information
        engine = get_reasoning_engine()
        result = engine.reason(last_user_msg, history=history_text)
        
        # 3. Generate LLM Response with Clinical Context
        # We inject the REAL clinical findings into the system prompt so the LLM is aligned
        clinical_context = f"""
        Current Assessment:
        - Urgency: {result.urgency_level.value}
        - Found Protocols: {', '.join(result.matched_protocols)}
        - Present Red Flags: {', '.join([rf.split('🔴 ')[1] for rf in result.what_we_know if '🔴' in rf])}
        - Missing Info: {', '.join([uk.split('❓ ')[1] for uk in result.what_we_dont_know if '❓' in uk])}
        """
        
        system_msg = {
            "role": "system",
            "content": f"""You are Dr. Pluto, a helpful and reassuring medical AI. 
            
            CLINICAL CONTEXT (Invisible to user, for your guidance):
            {clinical_context}
            
            Key Rules:
            1. Use simple, non-technical language.
            2. If Urgency is EMERGENCY, be direct but calm: advise ER immediately.
            3. If Missing Info is listed, ask ONE of the missing items naturally.
            4. Keep responses short (2-3 sentences).
            """
        }
        
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[system_msg] + messages[-6:], # Keep context window manageable
            temperature=0.6
        )
        
        response_text = completion.choices[0].message.content
        
        # 4. Return response + Structured Clinical Update
        # The frontend uses 'updated_analysis' to refresh the dashboard
        return {
            "response_text": response_text,
            "updated_analysis": {
                "triage_level": result.urgency_level.value,
                "urgency_summary": result.urgency_rationale,
                "differential_diagnosis": result.differential_diagnosis,
                "suggested_focus": result.follow_up_questions, # Mapping follow-ups to suggestion area
                "key_findings": result.what_we_know,
                "clinical_notes": result.clinical_summary
            }
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
