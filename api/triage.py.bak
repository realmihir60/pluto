from fastapi import FastAPI, Request
from mangum import Mangum
import os
import json
import openai

app = FastAPI()

# Minimal CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/triage")
def health():
    return {"status": "simple-alive", "version": "5.0.0"}

@app.post("/api/triage")
async def post_triage(request: Request):
    try:
        data = await request.json()
        input_text = data.get("input", "")
        
        # Self-contained logic (No python_core for now)
        apiKey = os.getenv("GROQ_API_KEY")
        if not apiKey:
             return {"triage_level": "info", "message": "API Key missing on server."}
             
        client = openai.OpenAI(api_key=apiKey, base_url="https://api.groq.com/openai/v1")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful medical assistant. Triage the user symptoms into: home_care, urgent, or emergency. Respond in JSON."},
                {"role": "user", "content": input_text}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {"error": str(e)}

handler = Mangum(app, lifespan="off")
