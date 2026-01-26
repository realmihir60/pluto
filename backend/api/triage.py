import openai
import json
import uuid
from datetime import datetime
from ..core.sanitizer import sanitize_and_analyze
from ..core.rule_engine import RuleEngine
from ..core.auth import get_current_user, get_db_session
from ..models import User, TriageEvent
from sqlmodel import Session, select

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class TriageRequest(BaseModel):
    input: str

class DifferentialItem(BaseModel):
    condition: str
    likelihood: Literal['High', 'Moderate', 'Low']
    rationale: str

class TriageResponse(BaseModel):
    version: str
    triage_level: str
    message: str
    matched_symptoms: List[str]
    disclaimer: str
    ai_analysis: Optional[bool] = False
    urgency_summary: Optional[str] = None
    key_findings: Optional[List[str]] = None
    differential_diagnosis: Optional[List[DifferentialItem]] = None
    suggested_focus: Optional[List[str]] = None
    follow_up_questions: Optional[List[str]] = None

@router.post("/triage", response_model=TriageResponse)
async def post_triage(
    request: TriageRequest, 
    user: User = Depends(get_consented_user),
    db: Session = Depends(get_db_session)
):
    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        # 1. Sanitization
        analysis = sanitize_and_analyze(request.input)
        
        # 2. Safety Layer: Crisis Keywords
        if analysis.hasCrisisKeywords:
            event = TriageEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                userId=user.id,
                symptoms=analysis.safeInput,
                aiResult={},
                actionRecommended="Crisis",
                urgency="High",
                engineVersion="2.1.0-crisis",
                logicSnapshot={"reason": "Crisis Keyword Detected", "keywords": analysis.detectedCrisisKeywords}
            )
            db.add(event)
            db.commit()
            return TriageResponse(
                version="2.1.0-crisis",
                triage_level="crisis",
                message="CRITICAL: Your input indicates a potential medical emergency.",
                urgency_summary="CRITICAL: Crisis keywords detected indicating immediate danger.",
                key_findings=["Crisis Keywords Detected"],
                differential_diagnosis=[{
                    "condition": "Emergency",
                    "likelihood": "High",
                    "rationale": "Immediate threat to life"
                }],
                suggested_focus=["Emergency Room"],
                follow_up_questions=[],
                matched_symptoms=[],
                disclaimer="Call 911 immediately."
            )

        # 3. Rule Engine Execution
        assessment = RuleEngine.assess([analysis.safeInput])
        
        # 4. Ambiguity Escalation Layer
        # If input is very short or assessment status is 'no_match', we flag as ambiguous
        is_ambiguous = len(analysis.safeInput.split()) < 3 or assessment["status"] == "no_match"
        
        # 5. Logic Snapshot (Capture state BEFORE AI)
        logic_snapshot = {
            "rule_engine_output": assessment,
            "is_ambiguous": is_ambiguous,
            "symptoms_mapped": assessment.get("risk_factors", []),
            "timestamp": datetime.utcnow().isoformat()
        }

        # 6. AI Augmentation with Compliance-Ready Prompt
        ai_result = None
        if GROQ_API_KEY:
            try:
                # If ambiguous, we inject a prompt command to ESCALATE rather than infer
                ambiguity_directive = (
                    "**SAFETY NOTICE**: The user's input is ambiguous or vague. "
                    "DO NOT try to be optimistic. If you cannot reach 95% confidence, "
                    "set 'triage_level' to 'seek_care' and explain that the symptoms are too vague to rule out serious issues."
                    if is_ambiguous else ""
                )

                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are Pluto, a **Clinical Decision Support Engine**. "
                                f"{ambiguity_directive}\n\n"
                                "Generate a **professional-grade clinical report**. "
                                "Kill the narrative. Use bullet points. "
                                "Differential Table: Rank by likelihood (High/Mod/Low). "
                                "One-Sentence Urgency: Explain why this level was chosen."
                            )
                        },
                        {"role": "user", "content": analysis.safeInput}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                ai_result = json.loads(completion.choices[0].message.content)
            except Exception as e:
                print(f"AI Triage Failed: {e}")

        # 7. Default Upward Logic (Ambiguity Enforcement)
        # If AI returns 'home_care' but we detected ambiguity, we force escalate to 'seek_care'
        if is_ambiguous and ai_result and ai_result.get("triage_level") == "home_care":
            ai_result["triage_level"] = "seek_care"
            ai_result["urgency_summary"] = "Escalated to 'Seek Care' due to high ambiguity in presenting symptoms."

        # 8. Save Compliance Snapshot
        final_level = ai_result.get("triage_level") if ai_result else assessment["triage_level"]
        event = TriageEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            userId=user.id,
            symptoms=request.input,
            aiResult=ai_result or {}, 
            actionRecommended=final_level,
            urgency="High" if "urgent" in final_level or "crisis" in final_level else "Low",
            engineVersion="2.1.0-hardened",
            logicSnapshot=logic_snapshot
        )
        db.add(event)
        db.commit()

        # 9. Return Response
        if ai_result:
            return TriageResponse(
                version="2.1.0-hardened",
                triage_level=ai_result.get("triage_level", "info"),
                message=ai_result.get("message", "Analysis completed."),
                matched_symptoms=ai_result.get("matched_symptoms", []),
                urgency_summary=ai_result.get("urgency_summary", ""),
                key_findings=ai_result.get("key_findings", []),
                differential_diagnosis=ai_result.get("differential_diagnosis", []),
                suggested_focus=ai_result.get("suggested_focus", []),
                follow_up_questions=ai_result.get("follow_up_questions", []),
                disclaimer="Safety-First AI Analysis. Verify with a professional.",
                ai_analysis=True
            )
        else:
            return TriageResponse(
                version="2.1.0-fallback-py",
                triage_level=assessment["triage_level"],
                message=assessment["guidance"],
                matched_symptoms=assessment["risk_factors"],
                urgency_summary="Rule-based determination (Safety-First Fallback).",
                key_findings=[f"{r} -> Detected" for r in assessment["risk_factors"]],
                differential_diagnosis=[],
                suggested_focus=["General Evaluation"],
                follow_up_questions=["Please provide more details."],
                disclaimer="Rule-based result. Consult a doctor.",
                ai_analysis=False
            )

    except Exception as e:
        print(f"Triage API Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Safety Error")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/triage/{event_id}")
async def get_triage_detail(
    event_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """
    Python version of the Triage Detail fetch API.
    """
    statement = select(TriageEvent).where(TriageEvent.id == event_id)
    event = db.exec(statement).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Security check: Ensure the event belongs to the authenticated user
    if event.userId != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this event")

    return event
