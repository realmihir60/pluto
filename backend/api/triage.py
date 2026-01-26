import openai
import json
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
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        # 1. Sanitization
        analysis = sanitize_and_analyze(request.input)
        
        if analysis.hasCrisisKeywords:
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

        # 2. Rule Engine
        assessment = RuleEngine.assess([analysis.safeInput])
        
        # 3. AI Augmentation
        ai_result = None
        if GROQ_API_KEY:
            try:
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are Pluto, a **Clinical Decision Support Engine**. "
                                "Generate a **professional-grade clinical report** for a doctor.\n\n"
                                "**OBJECTIVES**:\n"
                                "1. **Kill the narrative**: Use bullet points and rigid structures.\n"
                                "2. **Differential Table**: Rank conditions by likelihood (High/Mod/Low) with specific rationale.\n"
                                "3. **Key Findings**: Do not just repeat symptoms. specific specific meaning "
                                "(e.g. 'Exertional dyspnea -> Raises cardiac index').\n"
                                "4. **One-Sentence Urgency**: Why is this urgent? "
                                "(e.g. 'Urgent due to symptom X + Y in context of Z').\n\n"
                                "**OUTPUT JSON SCHEMA**:\n"
                                "{\n"
                                "  \"triage_level\": \"urgent\" | \"seek_care\" | \"home_care\" | \"info\",\n"
                                "  \"message\": \"Concise summary message.\",\n"
                                "  \"urgency_summary\": \"One specific sentence explaining why this level was chosen.\",\n"
                                "  \"key_findings\": [\"Finding 1 -> Implication\", \"Finding 2 -> Implication\"],\n"
                                "  \"differential_diagnosis\": [\n"
                                "    { \"condition\": \"Name\", \"likelihood\": \"High\" | \"Moderate\" | \"Low\", \"rationale\": \"Supporting features\" }\n"
                                "  ],\n"
                                "  \"suggested_focus\": [\"Area 1\", \"Area 2\"],\n"
                                "  \"follow_up_questions\": [\"Q1\", \"Q2\", \"Q3\"],\n"
                                "  \"matched_symptoms\": [\"List\"]\n"
                                "}"
                            )
                        },
                        {
                            "role": "user",
                            "content": analysis.safeInput
                        }
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                import json
                ai_result = json.loads(completion.choices[0].message.content)
            except Exception as e:
                print(f"AI Triage Failed: {e}")

        # 4. Construct Final Response
        if ai_result:
            return TriageResponse(
                version="2.1.0-pro-py",
                triage_level=ai_result.get("triage_level", "info"),
                message=ai_result.get("message", "AI analysis completed."),
                matched_symptoms=ai_result.get("matched_symptoms", []),
                urgency_summary=ai_result.get("urgency_summary", "Urgency determined by AI reasoning."),
                key_findings=ai_result.get("key_findings", []),
                differential_diagnosis=ai_result.get("differential_diagnosis", []),
                suggested_focus=ai_result.get("suggested_focus", []),
                follow_up_questions=ai_result.get("follow_up_questions", []),
                disclaimer="Generated by AI. Not a diagnosis. Verify with a professional.",
                ai_analysis=True
            )
        else:
            return TriageResponse(
                version="2.1.0-fallback-py",
                triage_level=assessment["triage_level"],
                message=assessment["guidance"],
                matched_symptoms=assessment["risk_factors"],
                urgency_summary="Rule-based determination based on keyword matches.",
                key_findings=[f"{r} -> Detected keyword" for r in assessment["risk_factors"]],
                differential_diagnosis=[],
                suggested_focus=["General Evaluation"],
                follow_up_questions=["Do you have any other symptoms?"],
                disclaimer="Rule-based result. Consult a doctor."
            )

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
