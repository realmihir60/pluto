from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add current directory to path
root_dir = os.path.dirname(os.path.abspath(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
print(f"DEBUG: Root dir added to path: {root_dir}")

app = FastAPI(title="Pluto Health API - Local Dev")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/")
async def health():
    return {"status": "healthy", "version": "local-dev"}

# Import routers
try:
    from py_api.triage import router as triage_router
    from py_api.chat import router as chat_router
    from py_api.consent import router as consent_router
    from py_api.memory import router as memory_router
    
    app.include_router(triage_router, prefix="/triage", tags=["triage"])
    app.include_router(chat_router, prefix="/chat", tags=["chat"])
    app.include_router(consent_router, prefix="/consent", tags=["consent"])
    app.include_router(memory_router, prefix="/memory", tags=["memory"])
    
    print("✅ All routers loaded")
except Exception as e:
    print(f"❌ Router import failed: {e}")
    import traceback
    traceback.print_exc()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Pluto Health API on http://localhost:8000")
    uvicorn.run("local_api:app", host="0.0.0.0", port=8000, reload=True)
