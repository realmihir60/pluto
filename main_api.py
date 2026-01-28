import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.getcwd())

from fastapi import FastAPI
from api.chat import app as chat_app
from api.triage import app as triage_app
from api.consent import app as consent_app
from api.memory import app as memory_app
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_app.router, prefix="/api/chat")
app.include_router(triage_app.router, prefix="/api/triage")
app.include_router(consent_app.router, prefix="/api/consent")
app.include_router(memory_app.router, prefix="/api/memory")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
