from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
import sys
import os
import traceback

# === Vercel Path Configuration ===
# Ensure the root project directory is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

app = FastAPI(title="Pluto Master Router")

# Global CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug Info Table
DEBUG_INFO = {
    "sys_path": sys.path,
    "python_version": sys.version,
    "cwd": os.getcwd(),
    "root_dir": root_dir,
    "env_vars_set": [k for k in os.environ.keys() if "KEY" in k or "URL" in k or "SECRET" in k]
}

@app.get("/api/health")
@app.get("/api/health/")
def health():
    try:
        # Test imports
        from api.endpoints.triage import router as triage_router
        return {
            "status": "healthy",
            "service": "pluto-master-router",
            "version": "3.3.0",
            "debug": DEBUG_INFO
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "debug": DEBUG_INFO
            }
        )

# Unified Route Inclusion with Lazy Loading fallback
try:
    from api.endpoints.triage import router as triage_router
    from api.endpoints.chat import router as chat_router
    from api.endpoints.consent import router as consent_router
    from api.endpoints.memory import router as memory_router
    
    app.include_router(triage_router, prefix="/api/triage")
    app.include_router(chat_router, prefix="/api/chat")
    app.include_router(consent_router, prefix="/api/consent")
    app.include_router(memory_router, prefix="/api/memory")
except Exception as e:
    print(f"CRITICAL API LOAD ERROR: {e}")
    traceback.print_exc()

# Global Error Handler for unexpected 500s
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path,
            "traceback": traceback.format_exc() if "localhost" in str(request.base_url) else "Redacted"
        }
    )

# Vercel entry point
handler = Mangum(app, lifespan="off")
