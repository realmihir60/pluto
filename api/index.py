from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Import all routers from the api folder
try:
    from api.triage import router as triage_router
    from api.chat import router as chat_router
    from api.consent import router as consent_router
    from api.memory import router as memory_router
except ImportError:
    # Fallback for local development or different PYTHONPATH
    from triage import router as triage_router
    from chat import router as chat_router
    from consent import router as consent_router
    from memory import router as memory_router

app = FastAPI(title="Pluto Unified API")

# Global CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root/Ping
@app.get("/api")
@app.get("/api/")
def root():
    return {"status": "alive", "service": "pluto-master-router", "version": "3.1.0"}

# Include all sub-routers with explicit prefixes
# This matches the frontend calls to /api/triage, /api/chat, etc.
app.include_router(triage_router, prefix="/api/triage")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(consent_router, prefix="/api/consent")
app.include_router(memory_router, prefix="/api/memory")

# Vercel entry point
handler = Mangum(app, lifespan="off")
