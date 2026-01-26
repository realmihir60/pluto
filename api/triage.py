import os
import json
import uuid
import openai
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends
from sqlmodel import Session

# Local imports
from python_core.models import User, TriageEvent, engine, MedicalFact
from python_core.rule_engine import RuleEngine
from python_core.sanitizer import sanitize_and_analyze
from python_core.auth import get_consented_user, get_db_session

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
            db.add(MedicalFact(userId=user_id, type=fact['type'], value=fact['value'], source="Triage Extraction"))
        db.commit()
    except Exception as e:
        print(f"Memory Sync Error: {e}")

@app.get("/api/triage")
def ping_triage():
    return {"status": "alive", "service": "triage-api"}

@app.post("/")
@app.post("/api/triage")
async def post_triage(
    request: Request, 
    user: User = Depends(get_consented_user),
    db: Session = Depends(get_db_session)
):
    try:
        data = await request.json()
        input_text = data.get("input")
        
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
                    {"role": "system", "content": f"You are Pluto, a Clinical Assistant. {ambiguity_directive}"},
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

        # 6. Persistence
        event = TriageEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            userId=user.id,
            symptoms=input_text,
            aiResult=ai_result or {},
            actionRecommended=final_level,
            urgency="High" if "urgent" in final_level or "crisis" in final_level else "Low",
            engineVersion="2.5.0-vercel",
            logicSnapshot={"rule_engine": assessment, "is_ambiguous": is_ambiguous}
        )
        db.add(event)
        db.commit()

        # 7. Background Memory Sync (Sequential for Serverless reliability)
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
        print(f"Vercel Triage Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
