from typing import Optional, List, Any
import os
import json
import openai
import uuid
import traceback
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports - updated to py_api context
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_core.models import User, TriageEvent, engine, MedicalFact
from python_core.rule_engine import RuleEngine
from python_core.sanitizer import sanitize_and_analyze
from python_core.auth import get_current_user_optional, get_db_session
from python_core.rate_limiter import get_rate_limiter
from python_core.logger import get_logger, LogLevel

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v3.0.0-namespace-v2"

async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Memory extraction logic"""
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
            db.add(MedicalFact(id=f"fact_{uuid.uuid4().hex[:6]}", userId=user_id, type=fact['type'], value=fact['value'], source="Triage Extraction"))
        db.commit()
    except Exception as e:
        print(f"Memory Sync Error: {e}")

@router.get("")
@router.get("/")
def ping_triage():
    return {"status": "alive", "service": "triage-v2", "build": BUILD_ID}

@router.post("")
@router.post("/")
async def post_triage(
    request: Request, 
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    import time
    rate_limiter = get_rate_limiter()
    logger = get_logger()
    start_time = time.time()
    
    identifier = user.id if user else (request.client.host if request.client else "unknown")
    
    try:
        rate_limiter.check_limit(identifier, is_authenticated=bool(user))
    except HTTPException as e:
        logger.log_error("rate_limit", f"Rate limit hit: {identifier}")
        raise e
    
    try:
        data = await request.json()
        input_text = data.get("input")
        
        # 1. Sanitization
        analysis = sanitize_and_analyze(input_text)
        
        # 2. Crisis Check
        if analysis.hasCrisisKeywords:
            return {
                "triage_level": "emergency",
                "severity": {"level": "EMERGENCY", "color": "red"},
                "friendly_message": "CRITICAL: Potential medical emergency.",
                "message": "Potential medical emergency detected.",
                "when_to_worry": ["Chest pain", "Difficulty breathing", "Altered consciousness"],
                "home_care_tips": ["Do not wait", "Call 911 immediately"]
            }

        # 3. Rule Engine assessment
        assessment = RuleEngine.assess([analysis.safeInput])
        is_ambiguous = len(analysis.safeInput.split()) < 3 or assessment["status"] == "no_match"
        
        # 4. AI Augmentation (Groq)
        ai_result = None
        if GROQ_API_KEY:
            client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
            
            # Load Clinical Protocols
            try:
                with open("python_core/clinical_protocols.json", "r") as f:
                    protocols = json.load(f)
                protocol_guidance = json.dumps(protocols, indent=2)
            except:
                protocol_guidance = "Focus on safety and reassurance."
            
            system_prompt = f"""You are Dr. Pluto, a clinical triage expert.
            
            CLINICAL GUIDANCE:
            {protocol_guidance}
            
            OUTPUT FORMAT (JSON):
            {{
              "triage_level": "emergency" | "urgent" | "schedule_appointment" | "monitor_followup" | "home_care",
              "friendly_message": "...",
              "assessment_table": {{
                "chief_complaint": "...",
                "what_we_know": ["..."],
                "what_we_need_to_check": ["..."],
                "concerning_signs_to_watch": ["..."]
              }},
              "likely_cause_simple": "...",
              "when_to_worry": ["..."],
              "home_care_if_mild": ["..."],
              "follow_up_questions": ["..."]
            }}"""
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": analysis.safeInput}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            ai_result = json.loads(completion.choices[0].message.content)

        final_level = ai_result.get("triage_level") if ai_result else assessment["triage_level"]
        
        # Save Event
        if user:
            event = TriageEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                userId=user.id,
                symptoms=input_text,
                aiResult=ai_result or {},
                actionRecommended=final_level,
                urgency="High" if final_level in ["emergency", "urgent"] else "Low",
                engineVersion=BUILD_ID
            )
            db.add(event)
            db.commit()
            await extract_and_save_facts(user.id, input_text, db)

        # Build Response
        result = {
            "triage_level": final_level,
            "severity": {
                "level": final_level.upper().replace("_", " "),
                "color": "red" if final_level in ["emergency", "urgent"] else "blue"
            },
            "friendly_message": ai_result.get("friendly_message") if ai_result else assessment["guidance"],
            "summary": ai_result.get("friendly_message") if ai_result else assessment["guidance"],
            "urgency_summary": ai_result.get("friendly_message", ""),
            "assessment_table": ai_result.get("assessment_table", {}),
            "likely_cause": ai_result.get("likely_cause_simple", ""),
            "when_to_worry": ai_result.get("when_to_worry", []),
            "home_care_tips": ai_result.get("home_care_if_mild", []),
            "follow_up_questions": ai_result.get("follow_up_questions", []),
            "confidence": {"level": "High Confidence", "value": 0.9}
        }
        
        return result

    except Exception as e:
        print(f"Triage Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
