from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
from sqlmodel import Session, select
from ..models import User, MedicalFact
from ..core.auth import get_current_user
from .memory import extract_and_save_facts, engine

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/chat")
async def post_chat(request: ChatRequest, x_user_email: Optional[str] = Header(None)):
    """
    Python version of the Follow-up Chat API.
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Chat functionality unavailable (Missing API Key).")

    user_profile = "Unknown User (Guest)"
    facts_list = "None"
    user_id = None

    if x_user_email:
        with Session(engine) as session:
            statement = select(User).where(User.email == x_user_email)
            user = session.exec(statement).first()
            if user:
                user_id = user.id
                user_profile = f"{user.name} ({user.email})"
                facts = user.medical_facts
                facts_list = "\n".join([f"- {f.type}: {f.value}" for f in facts])

    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are Pluto, a **Medical Education Assistant**.\n\n"
                    "**USER CONTEXT**:\n"
                    f"User: {user_profile}\n"
                    "KNOWN MEDICAL PROFILE (from DB):\n"
                    f"{facts_list}\n\n"
                    "You have just provided an educational assessment to the user.\n"
                    "Now you are answering follow-up questions about **concepts**, not the user's specific body.\n\n"
                    "**CRITICAL SAFETY RULES**:\n"
                    "1. **NO DIAGNOSIS**: Do not say 'You likely have...'. Say 'This condition is often characterized by...'.\n"
                    "2. **EVIDENCE TRACKING**: You only know what the user explicitly stated. Do NOT assume habits.\n"
                    "3. **HOLISTIC SYNTHESIS**: If the user adds new symptoms, try to find a single underlying cause (e.g. 'Viral Trome') "
                    "that explains BOTH.\n"
                    "4. **DISJOINT WARNING**: Only block if the new symptom is **Red Flag AND Unrelated**."
                )
            }
        ]
        
        # Add conversation history
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.3
        )

        content = completion.choices[0].message.content

        # Background Fact Extraction
        if user_id and content:
            last_user_msg = request.messages[-1].content if request.messages else ""
            context = f"User: {last_user_msg}\nAssistant: {content}"
            # In a real FastAPI app, use BackgroundTasks. For this demo, we'll call it.
            import asyncio
            asyncio.create_task(extract_and_save_facts(user_id, context))

        return {"role": "assistant", "content": content}

    except Exception as e:
        print(f"Chat API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")
