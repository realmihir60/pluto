import os
import json
import openai
import uuid
import traceback
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, TriageEvent, engine, MedicalFact
from python_core.rule_engine import RuleEngine
from python_core.sanitizer import sanitize_and_analyze
from python_core.auth import get_current_user_optional, get_db_session # Changed import

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BUILD_ID = "v2.6.3-route-fix"

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

@app.get("/")
def ping_triage():
    return {"status": "alive", "service": "triage-api", "build": BUILD_ID, "mode": "anonymous_ok"}

@app.post("/")
async def post_triage(
    request: Request, 
    user: Optional[User] = Depends(get_current_user_optional), # Changed user dependency
    db: Session = Depends(get_db_session)
):
    try:
        data = await request.json()
        input_text = data.get("input")
        
        # Determine user ID for logging/persistence
        user_id_for_event = user.id if user else "anonymous"

        # 1. Sanitization
        analysis = sanitize_and_analyze(input_text)
        
        # 2. Crisis Check
        if analysis.hasCrisisKeywords:
            event = TriageEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                userId=user.id,
                symptoms=analysis.safeInput,
                actionRecommended="Crisis",
                urgency="High",
                engineVersion="2.5.0-crisis",
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
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": (
                        "You are Pluto, a Clinical Assistant. SCOPE: ONLY answer questions regarding medical symptoms, health data, or clinical triage. "
                        "If the user input is not medical (e.g. general chat, math, non-health jokes), return a JSON object with: "
                        "{'triage_level': 'info', 'message': 'I am Pluto, and I can only assist with medical or health-related inquiries. Please provide your symptoms.', 'matched_symptoms': [], 'urgency_summary': 'Out of Scope.'} "
                        f"{ambiguity_directive}"
                    )},
                    {"role": "user", "content": analysis.safeInput}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
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

        # 8. Return Flattened Response for UI Compatibility
        if ai_result:
            return {
                "version": "2.5.0-hardened-vercel",
                "triage_level": final_level,
                "message": ai_result.get("message", assessment["guidance"]),
                "matched_symptoms": ai_result.get("matched_symptoms", assessment["risk_factors"]),
                "urgency_summary": ai_result.get("urgency_summary", ""),
                "key_findings": ai_result.get("key_findings", []),
                "differential_diagnosis": ai_result.get("differential_diagnosis", []),
                "suggested_focus": ai_result.get("suggested_focus", []),
                "follow_up_questions": ai_result.get("follow_up_questions", []),
                "ai_analysis": True,
                "is_ambiguous": is_ambiguous
            }
        else:
            return {
                "version": "2.5.0-fallback-vercel",
                "triage_level": final_level,
                "message": assessment["guidance"],
                "matched_symptoms": assessment["risk_factors"],
                "urgency_summary": "Rule-based determination.",
                "key_findings": [f"{r} detected" for r in assessment["risk_factors"]],
                "differential_diagnosis": [],
                "suggested_focus": ["General Evaluation"],
                "follow_up_questions": ["Please provide more details."],
                "ai_analysis": False,
                "is_ambiguous": is_ambiguous
            }

    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Vercel Triage Error: {error_info}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_info})
