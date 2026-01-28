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
            
            system_prompt = f"""You are Pluto, an AI Clinical Triage Assistant. Your role is to provide DETAILED clinical analysis.

SCOPE: ONLY answer questions regarding medical symptoms, health data, or clinical triage. If the user input is not medical (e.g. general chat, math, coding, cooking), return: {{'triage_level': 'info', 'message': 'I can only assist with medical or health-related inquiries.', 'matched_symptoms': [], 'urgency_summary': 'Out of Scope.', 'follow_up_questions': []}}

CLINICAL PROTOCOLS (Use these to guide your analysis):
{protocol_guidance}

INSTRUCTIONS FOR DETAILED ANALYSIS:
1. **Analyze Thoroughly**: Consider all aspects of the symptoms described
2. **Generate Follow-up Questions**: ALWAYS ask 3-5 specific clinical questions to gather more information
3. **Provide Context**: Explain WHY youre asking each question and what youre ruling out
4. **Differential Diagnosis**: List 2-4 possible conditions with likelihood and rationale
5. **Key Findings**: Extract and highlight the most important clinical details

{ambiguity_directive}

REQUIRED JSON OUTPUT SCHEMA:
{{
  "triage_level": "home_care" | "seek_care" | "urgent" | "crisis" | "info",
  "message": "Brief 1-2 sentence summary of the situation",
  "matched_symptoms": ["List of key symptoms identified"],
  "urgency_summary": "Detailed 3-4 sentence explanation of why this urgency level was chosen. Include context about what youre concerned about and what youre monitoring for.",
  "key_findings": ["Important clinical detail 1", "Important clinical detail 2", "etc"],
  "differential_diagnosis": [
    {{"condition": "Most likely condition", "likelihood": "High/Medium/Low", "rationale": "Why this is considered"}},
    {{"condition": "Alternative possibility", "likelihood": "Medium/Low", "rationale": "Why this is also considered"}}
  ],
  "suggested_focus": ["Area to monitor 1", "Area to monitor 2"],
  "follow_up_questions": [
    "Specific question about timing/onset?",
    "Question about associated symptoms?",
    "Question about severity/progression?",
    "Question about previous history?"
  ],
  "clinical_notes": "Detailed clinical reasoning block if a pivot or multi-system involvement is detected. NEVER return empty if a pivot occurs."
}}

CRITICAL: Always include at least 3 follow_up_questions to better understand the clinical picture. Make urgency_summary detailed (3-4 sentences minimum). Provide comprehensive differential_diagnosis."""
            
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
                "clinical_notes": ai_result.get("clinical_notes", ""),
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
                "clinical_notes": "",
                "ai_analysis": False,
                "is_ambiguous": is_ambiguous
            }

    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Vercel Triage Error: {error_info}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": error_info})
