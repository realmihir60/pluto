from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import sys
import os

# Ensure the parent directory is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import all routers from the endpoints folder
try:
    from api.endpoints.triage import router as triage_router
    from api.endpoints.chat import router as chat_router
    from api.endpoints.consent import router as consent_router
    from api.endpoints.memory import router as memory_router
except ImportError as e:
    print(f"IMPORT ERROR in index.py: {e}")
    # Fallback for different environments
    from endpoints.triage import router as triage_router
    from endpoints.chat import router as chat_router
    from endpoints.consent import router as consent_router
    from endpoints.memory import router as memory_router

app = FastAPI(title="Pluto Master Router")

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
@app.get("/api/health")
def root():
    return {"status": "alive", "service": "pluto-master-router", "version": "3.2.0"}

# Include all sub-routers with explicit prefixes
# On Vercel, the incoming request for /api/triage will hit this app.
# We need to handle both the prefixed and non-prefixed versions.
app.include_router(triage_router, prefix="/api/triage")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(consent_router, prefix="/api/consent")
app.include_router(memory_router, prefix="/api/memory")

# Vercel entry point
handler = Mangum(app, lifespan="off")
