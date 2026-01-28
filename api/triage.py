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
from python_core.models import User, TriageEvent, engine, MedicalFact
from python_core.rule_engine import RuleEngine
from python_core.sanitizer import sanitize_and_analyze
from python_core.auth import get_current_user_optional, get_db_session
from python_core.rate_limiter import get_rate_limiter
from python_core.logger import get_logger, LogLevel

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v2.6.4-final-handshake"

async def extract_and_save_facts(user_id: str, text: str, db: Session):
    """Refactored memory extraction logic for Vercel"""
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
    return {"status": "alive", "service": "triage-api", "build": BUILD_ID, "mode": "anonymous_ok"}

@router.post("")
@router.post("/")
async def post_triage(
    request: Request, 
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db_session)
):
    # === SAFETY INFRASTRUCTURE ===
    import time
    rate_limiter = get_rate_limiter()
    logger = get_logger()
    start_time = time.time()
    
    # Identify user or IP
    identifier = user.id if user else (request.client.host if request.client else "unknown")
    
    # Rate limiting check
    try:
        rate_limiter.check_limit(identifier, is_authenticated=bool(user))
    except HTTPException as e:
        logger.log_error("rate_limit", f"Rate limit hit: {identifier}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again in 1 hour.",
                "user_message": "For urgent concerns, call 911 or visit the emergency room."
            }
        )
    # === END SAFETY INFRASTRUCTURE ===
    
    try:
        data = await request.json()
        input_text = data.get("input")
        
        # Determine user ID for logging/persistence
        user_id_for_event = user.id if user else "anonymous"

        # 1. Sanitization
        analysis = sanitize_and_analyze(input_text)
        
        # 2. Crisis Check
        if analysis.hasCrisisKeywords:
            if user:
                event = TriageEvent(
                    id=f"evt_{uuid.uuid4().hex[:8]}",
                    userId=user.id,
                    symptoms=analysis.safeInput,
                    actionRecommended="Crisis",
                    urgency="High",
                    engineVersion="2.6.4-crisis",
                    logicSnapshot={"reason": "Crisis Keyword Detected"}
                )
                db.add(event)
                db.commit()
            return {
                "triage_level": "crisis",
                "message": "CRITICAL: Potential medical emergency.",
                "disclaimer": "Call 911 immediately."
            }

        # 3. Rule Engine
        assessment = RuleEngine.assess([analysis.safeInput])
        is_ambiguous = len(analysis.safeInput.split()) < 3 or assessment["status"] == "no_match"
        
        # 4. AI Augmentation (Groq)
        ai_result = None
        if GROQ_API_KEY:
            client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
            ambiguity_directive = "Input is ambiguous. Escalate rather than infer." if is_ambiguous else ""
            
            # Load Clinical Protocols for detailed guidance
            try:
                with open("python_core/clinical_protocols.json", "r") as f:
                    protocols = json.load(f)
                protocol_guidance = json.dumps(protocols, indent=2)
            except Exception as e:
                print(f"Failed to load protocols: {e}")
                protocol_guidance = "No specific protocols available."
            
            system_prompt = f"""You are Dr. Pluto, a friendly family doctor. Your goal is to understand the patient's symptoms like a real doctor would - methodically, reassuringly, and using everyday language.

GOLDEN RULES:
1. **SIMPLE LANGUAGE ONLY**: Use everyday words that anyone can understand
   - Say "dizzy" not "vertigo"
   - Say "belly" not "abdomen"  
   - Say "throwing up" not "emesis"
   - Say "short of breath" not "dyspnea"
   - Say "when you stand up" not "orthostatic"

2. **BE REASSURING FIRST**: Most symptoms have benign causes. Don't scare patients without evidence.
   - Start with "Most of the time, this is nothing serious"
   - Say "Let's figure out what's going on together"
   - Avoid listing worst-case scenarios

3. **ASK BEFORE DIAGNOSING**: Real doctors gather key facts before forming conclusions
   - Ask 2-3 specific, focused questions
   - Explain WHY you're asking each question
   - Build trust by showing your thought process

4. **CONSERVATIVE ESCALATION**: Don't jump to "emergency" without red flags
   - Default to "monitor at home" unless data says otherwise
   - Only escalate when specific warning signs are present

SCOPE CHECK: ONLY answer medical/health questions. If the input is about cooking, coding, or general chat, politely decline: {{'triage_level': 'info', 'message': 'I can only help with medical or health-related questions.', 'assessment_table': {{}}, 'follow_up_questions': []}}

CLINICAL PROTOCOLS (Reference for red/green flags):
{protocol_guidance}

{ambiguity_directive}

RESPONSE STRUCTURE (Required JSON):
{{
  "triage_level": "home_care" | "monitor_followup" | "schedule_appointment" | "urgent" | "emergency",
  
  "friendly_message": "Your conversational response in SIMPLE, REASSURING language (2-3 sentences). Start with reassurance, then explain what you're thinking.",
  
  "assessment_table": {{
    "chief_complaint": "What brought you in (in patient's own words)",
    "what_we_know": [
      "Key fact 1 from their description",
      "Key fact 2",
      "Key fact 3"
    ],
    "what_we_need_to_check": [
      "Important question 1 to clarify situation",
      "Important question 2 to rule out serious causes",
      "Important question 3 for timeline/severity"
    ],
    "concerning_signs_to_watch": [
      "Red flag 1 (in simple terms)",
      "Red flag 2 (in simple terms)"
    ]
  }},
  
  "follow_up_questions": [
    "When did this start? (I'm asking because sudden symptoms can be different from gradual ones)",
    "On a scale of 1-10, how bad is it? (This helps me understand severity)",
    "What makes it better or worse? (This gives clues about the cause)"
  ],
  
  "likely_cause_simple": "Most common benign explanation in everyday language (e.g., 'This sounds like a tension headache' not 'Cephalgia, tension-type')",
  
  "when_to_worry": [
    "Clear warning sign 1 that means 'see a doctor today'",
    "Clear warning sign 2 that means 'go to ER'"
  ],
  
  "home_care_if_mild": [
    "Simple self-care step 1",
    "Simple self-care step 2"
  ]
}}

EXAMPLES OF GOOD vs BAD RESPONSES:

❌ BAD (Too technical, scary):
"Differential diagnosis includes subarachnoid hemorrhage, meningitis, or migraine. Do you have nuchal rigidity or photophobia?"

✅ GOOD (Simple, reassuring):
"Headaches are really common and most of the time they're not serious. Let me ask you a few things to understand what's going on: When did this headache start? I'm asking because sudden 'thunderclap' headaches that hit their worst in seconds need urgent attention, while gradual headaches are usually less concerning."

QUESTION STYLE:
- ✅ "Does the pain travel down your arm?"
- ❌ "Is there radiation to the upper extremity?"

- ✅ "Do you feel dizzy when you stand up quickly?"
- ❌ "Do you experience orthostatic hypotension?"

- ✅ "Does it hurt when you swallow?"
- ❌ "Any odynophagia?"

TRIAGE LEVEL GUIDANCE:
- **home_care**: Clear benign pattern, no red flags, patient can self-monitor
- **monitor_followup**: Symptoms need watching, check back in 24-48 hours
- **schedule_appointment**: See your regular doctor within a week
- **urgent**: See a doctor TODAY (red flags present but not life-threatening)
- **emergency**: Go to ER NOW or call 911 (immediate danger)

Remember: You're a reassuring family doctor, not a medical textbook. Speak like you're talking to a family member."""
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": analysis.safeInput}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=1000
            )
            ai_result = json.loads(completion.choices[0].message.content)

        # 5. Default Upward
        final_level = ai_result.get("triage_level") if ai_result else assessment["triage_level"]
        if is_ambiguous and final_level == "home_care":
            final_level = "seek_care"

        # 6. Persistence (only for authenticated users)
        if user:
            event = TriageEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                userId=user.id,
                symptoms=input_text,
                aiResult=ai_result or {},
                actionRecommended=final_level,
                urgency="High" if "urgent" in final_level or "crisis" in final_level else "Low",
                engineVersion="2.6.1-anonymous",
                logicSnapshot={"rule_engine": assessment, "is_ambiguous": is_ambiguous}
            )
            db.add(event)
            db.commit()

            # 7. Background Memory Sync (only for authenticated)
            await extract_and_save_facts(user.id, input_text, db)

        # 8. Return Response with NEW Structure (Backward Compatible)
        if ai_result:
            return {
                "version": "3.0.0-doctor-friendly",
                "triage_level": final_level,
                "message": ai_result.get("friendly_message", ai_result.get("message", assessment["guidance"])),
                "assessment_table": ai_result.get("assessment_table", {
                    "chief_complaint": input_text,
                    "what_we_know": assessment["risk_factors"],
                    "what_we_need_to_check": ai_result.get("follow_up_questions", []),
                    "concerning_signs_to_watch": []
                }),
                "likely_cause": ai_result.get("likely_cause_simple", ""),
                "when_to_worry": ai_result.get("when_to_worry", []),
                "home_care_tips": ai_result.get("home_care_if_mild", []),
                "follow_up_questions": ai_result.get("follow_up_questions", []),
                # Legacy fields for backward compatibility
                "matched_symptoms": ai_result.get("matched_symptoms", assessment["risk_factors"]),
                "urgency_summary": ai_result.get("urgency_summary", ai_result.get("friendly_message", "")),
                "key_findings": ai_result.get("key_findings", ai_result.get("assessment_table", {}).get("what_we_know", [])),
                "differential_diagnosis": ai_result.get("differential_diagnosis", []),
                "suggested_focus": ai_result.get("suggested_focus", []),
                "clinical_notes": ai_result.get("clinical_notes", ""),
                "ai_analysis": True,
                "is_ambiguous": is_ambiguous
            }
        
        # === LOG PERFORMANCE METRICS ===
        duration_ms = (time.time() - start_time) * 1000
        logger.log_triage(
            user_id=user.id if user else None,
            input_text=input_text[:100] + "..." if len(input_text) > 100 else input_text,
            result={"triage_level": final_level, "ai_analysis": True},
            duration_ms=duration_ms
        )
        logger.log_performance("triage_request", duration_ms)
        # === END LOGGING ===
        
        return {
                "version": "3.0.0-fallback",
                "triage_level": final_level,
                "message": assessment["guidance"],
                "assessment_table": {
                    "chief_complaint": input_text,
                    "what_we_know": assessment["risk_factors"],
                    "what_we_need_to_check": ["Please provide more details about your symptoms."],
                    "concerning_signs_to_watch": []
                },
                "likely_cause": "Unable to determine without more information",
                "when_to_worry": [],
                "home_care_tips": [],
                "follow_up_questions": ["Please provide more details."],
                # Legacy fields
                "matched_symptoms": assessment["risk_factors"],
                "urgency_summary": "Rule-based determination.",
                "key_findings": [f"{r} detected" for r in assessment["risk_factors"]],
                "differential_diagnosis": [],
                "suggested_focus": ["General Evaluation"],
                "clinical_notes": "",
                "ai_analysis": False,
                "is_ambiguous": is_ambiguous
            }

    except HTTPException:
        # Re-raise HTTP exceptions (like rate limit)
        raise
    except Exception as e:
        # === COMPREHENSIVE ERROR HANDLING ===
        logger.log_error(
            "triage_error",
            str(e),
            {
                "user_id": user.id if user else None,
                "traceback": traceback.format_exc()[:500]
            }
        )
        
        # User-friendly error messages
        user_message = "We encountered an issue processing your symptoms. For urgent concerns, call 911."
        error_type = "system_error"
        
        if "groq" in str(e).lower() or "openai" in str(e).lower():
            user_message = "Our AI assistant is temporarily unavailable. Please try again in a moment."
            error_type = "llm_error"
        elif "database" in str(e).lower() or "connection" in str(e).lower():
            user_message = "We're experiencing connection issues. Your data is safe. Please try again."
            error_type = "database_error"
        elif "timeout" in str(e).lower():
            user_message = "Your request took too long to process. Please try with a shorter description."
            error_type = "timeout_error"
        
        print(f"Triage Error [{error_type}]: {e}")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": error_type,
                "message": user_message,
                "support": "If this persists, contact support@plutohealth.ai",
                "emergency_notice": "For medical emergencies, call 911 immediately."
            }
        )
        # === END ERROR HANDLING ===
