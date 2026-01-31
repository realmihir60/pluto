from typing import Optional, List, Any
import os
import json
import openai
import uuid
import traceback
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python_core.models import User, TriageEvent, engine, MedicalFact
from python_core.clinical_reasoning_engine import get_reasoning_engine, UrgencyLevel
from python_core.sanitizer import sanitize_and_analyze
from python_core.auth import get_current_user_optional, get_db_session
from python_core.rate_limiter import get_rate_limiter
from python_core.logger import get_logger

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v4.0.0-reasoning-engine"


async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Memory extraction logic."""
    if not GROQ_API_KEY:
        return
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
async def ping_triage():
    return {"status": "alive", "service": "triage-v4", "build": BUILD_ID, "methods": ["GET", "POST"]}


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
        input_text = data.get("input", "")
        history = data.get("history", [])  # For multi-turn reasoning
        
        # 1. Sanitization
        analysis = sanitize_and_analyze(input_text)
        
        # 2. Note crisis keywords but DON'T return early - we want full clinical analysis
        is_crisis = analysis.hasCrisisKeywords
        
        # 3. Clinical Reasoning Engine - always run for full differential/follow-up
        reasoning_engine = get_reasoning_engine()
        result = reasoning_engine.reason(analysis.safeInput, history)
        
        # Override urgency to EMERGENCY if crisis detected
        if is_crisis:
            result.urgency_level = UrgencyLevel.EMERGENCY
            result.urgency_rationale = "CRITICAL: Crisis keywords detected. " + result.urgency_rationale
        
        # 4. Optional: AI Enhancement for Clinical Summary
        ai_enhanced = None
        if GROQ_API_KEY and result.urgency_level not in [UrgencyLevel.EMERGENCY]:
            try:
                ai_enhanced = await enhance_with_llm(
                    result.chief_complaint,
                    result.what_we_know,
                    result.what_we_dont_know,
                    result.urgency_level.value
                )
            except Exception as e:
                print(f"LLM Enhancement failed (non-critical): {e}")
        
        # 5. Save Event
        if user:
            event = TriageEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                userId=user.id,
                symptoms=input_text,
                aiResult=result.to_dict(),
                actionRecommended=result.urgency_level.value,
                urgency="High" if result.urgency_level in [UrgencyLevel.EMERGENCY, UrgencyLevel.URGENT] else "Low",
                engineVersion=BUILD_ID
            )
            db.add(event)
            db.commit()
            await extract_and_save_facts(user.id, input_text, db)

        # 6. Build Response
        duration_ms = int((time.time() - start_time) * 1000)
        
        return {
            # Legacy fields for backward compatibility
            "triage_level": result.urgency_level.value,
            "severity": {
                "level": result.urgency_level.value.upper().replace("_", " "),
                "color": get_severity_color(result.urgency_level)
            },
            "friendly_message": ai_enhanced or result.clinical_summary,
            "summary": result.clinical_summary,
            
            # New structured fields
            "chief_complaint": result.chief_complaint,
            "matched_protocols": result.matched_protocols,
            "urgency_rationale": result.urgency_rationale,
            
            # Transparency fields
            "what_we_know": result.what_we_know,
            "what_we_dont_know": result.what_we_dont_know,
            "anti_hallucination_notes": result.anti_hallucination_notes,
            
            # Clinical guidance
            "follow_up_questions": result.follow_up_questions,
            "differential_diagnosis": result.differential_diagnosis,
            "criteria_matrix": {k: v.to_dict() for k, v in result.criteria_matrix.items()},
            
            # Legacy fields (keeping for frontend compatibility)
            "when_to_worry": [rf for item in result.what_we_know if "🔴" in item for rf in [item.split(":")[0].replace("🔴 ", "")]],
            "home_care_tips": get_home_care_tips(result.urgency_level),
            
            # Metadata
            "confidence": {
                "level": "High" if result.what_we_know else "Limited",
                "value": 0.9 if result.what_we_know else 0.5
            },
            "engine_version": BUILD_ID,
            "processing_time_ms": duration_ms
        }

    except Exception as e:
        print(f"Triage Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def get_severity_color(level: UrgencyLevel) -> str:
    """Map urgency level to display color."""
    colors = {
        UrgencyLevel.EMERGENCY: "red",
        UrgencyLevel.URGENT: "orange",
        UrgencyLevel.SCHEDULE_APPOINTMENT: "yellow",
        UrgencyLevel.MONITOR_FOLLOWUP: "blue",
        UrgencyLevel.HOME_CARE: "green"
    }
    return colors.get(level, "blue")


def get_home_care_tips(level: UrgencyLevel) -> List[str]:
    """Get generic home care tips based on urgency."""
    if level == UrgencyLevel.EMERGENCY:
        return ["Call 911 or go to ER immediately", "Do not drive yourself"]
    elif level == UrgencyLevel.URGENT:
        return ["Seek care today if possible", "If symptoms worsen, go to ER"]
    elif level == UrgencyLevel.SCHEDULE_APPOINTMENT:
        return ["Schedule appointment within 2-3 days", "Rest and stay hydrated"]
    else:
        return [
            "Rest and monitor symptoms",
            "Stay hydrated",
            "Track any changes",
            "Seek care if symptoms worsen"
        ]


async def enhance_with_llm(
    complaint: str,
    what_we_know: List[str],
    what_we_dont_know: List[str],
    urgency: str
) -> Optional[str]:
    """
    Use LLM to generate a more natural, empathetic clinical summary.
    This is optional enhancement - the system works without it.
    """
    if not GROQ_API_KEY:
        return None
    
    client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    
    system_prompt = """You are Dr. Pluto, a warm and reassuring clinical triage assistant.
    
RULES:
1. Be empathetic but factual
2. Use simple language (no medical jargon)
3. Be concise (2-3 sentences max)
4. DO NOT make diagnoses
5. Focus on guidance, not speculation

You will receive structured clinical data. Generate a friendly summary."""

    user_msg = f"""
Complaint: {complaint}
Urgency Level: {urgency}
What We Know: {json.dumps(what_we_know)}
What We Don't Know: {json.dumps(what_we_dont_know)}

Generate a brief, empathetic summary for the patient."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.3,
            max_tokens=150
        )
        return completion.choices[0].message.content.strip()
    except Exception:
        return None
