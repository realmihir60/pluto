import os
import json
from typing import List, Dict, Any
import openai
from sqlmodel import Session, create_engine
from ..models import MedicalFact

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL) if DATABASE_URL else None

async def extract_and_save_facts(user_id: str, text: str):
    """
    Python version of the Memory Service.
    Extracts permanent medical facts from text using LLM.
    """
    if not GROQ_API_KEY:
        print("Memory Service: Missing API Key")
        return

    client = openai.OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )

    print(f"Memory Service: Extracting facts for user {user_id}")

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a medical data clerk. Extract PERMANENT medical facts from the user's text.\n"
                        "Ignore temporary symptoms like 'I have a headache'.\n"
                        "Focus on:\n"
                        "1. Chronic Conditions (e.g. Asthma, Diabetes)\n"
                        "2. Medications (e.g. Lisinopril, Ibuprofen)\n"
                        "3. Allergies (e.g. Penicillin, Peanuts)\n"
                        "4. Surgeries (e.g. Appendectomy)\n"
                        "5. Biological Sex or Age if mentioned.\n\n"
                        "**OUTPUT JSON**:\n"
                        "{\n"
                        "    \"facts\": [\n"
                        "        { \"type\": \"Condition\" | \"Medication\" | \"Allergy\" | \"Surgery\" | \"Profile\", "
                        "\"value\": \"Asthma\", \"meta\": {} }\n"
                        "    ]\n"
                        "}\n"
                        "If nothing relevant, return { \"facts\": [] }."
                    )
                },
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )

        content = completion.choices[0].message.content
        result = json.loads(content or '{"facts": []}')

        if result.get("facts") and engine:
            print(f"Memory Service: Found facts: {result['facts']}")
            with Session(engine) as session:
                for fact in result["facts"]:
                    # Create unique ID (porting cuid behavior roughly or using uuid)
                    import uuid
                    new_fact = MedicalFact(
                        id=f"fact_{uuid.uuid4().hex[:8]}",
                        userId=user_id,
                        type=fact["type"],
                        value=fact["value"],
                        meta=fact.get("meta", {}),
                        source="Chat Extraction (Py)",
                        confidence="Inferred"
                    )
                    session.add(new_fact)
                session.commit()

    except Exception as e:
        print(f"Memory Extraction Failed: {e}")
