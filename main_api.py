import sys
import os
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.getcwd())

from fastapi import FastAPI
from api.endpoints.chat import router as chat_router
from api.endpoints.triage import router as triage_router
from api.endpoints.consent import router as consent_router
from api.endpoints.memory import router as memory_router
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

app.include_router(chat_router, prefix="/api/chat")
app.include_router(triage_router, prefix="/api/triage")
app.include_router(consent_router, prefix="/api/consent")
app.include_router(memory_router, prefix="/api/memory")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
