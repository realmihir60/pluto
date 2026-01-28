from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
import os
import sys
import traceback

# Add root directory to path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

app = FastAPI(title="Pluto Health API v2", version="2.4.0")

# Global CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v2/health")
@app.get("/api/v2/")
async def health_check():
    """Diagnostic endpoint"""
    return {
        "status": "healthy",
        "version": "2.4.0",
        "cwd": os.getcwd(),
        "python_version": sys.version,
    }

# Try to import and register routers, but don't crash if it fails
routers_loaded = False
import_error = None

try:
    from py_api.triage import router as triage_router
    from py_api.chat import router as chat_router
    from py_api.consent import router as consent_router
    from py_api.memory import router as memory_router
    
    app.include_router(triage_router, prefix="/api/v2/triage", tags=["triage"])
    app.include_router(chat_router, prefix="/api/v2/chat", tags=["chat"])
    app.include_router(consent_router, prefix="/api/v2/consent", tags=["consent"])
    app.include_router(memory_router, prefix="/api/v2/memory", tags=["memory"])
    
    routers_loaded = True
except Exception as e:
    import_error = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "type": type(e).__name__
    }
    print(f"❌ Router import failed: {e}")
    traceback.print_exc()

@app.get("/api/v2/status")
async def router_status():
    """Check if routers loaded successfully"""
    return {
        "routers_loaded": routers_loaded,
        "import_error": import_error,
        "available_routes": [route.path for route in app.routes if hasattr(route, 'path')]
    }

# Vercel handler
handler = Mangum(app, lifespan="off")
