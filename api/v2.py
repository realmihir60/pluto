from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
import os
import sys
import traceback

# Add root directory to path for local imports
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

app = FastAPI(title="Pluto Health API v2", version="2.3.0")

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
@app.get("/api/v2")
async def health_check():
    """Diagnostic endpoint to verify API is running"""
    diag = {
        "status": "healthy",
        "version": "2.3.0",
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "root_dir": root_dir,
    }
    
    # Test if we can import the routers
    try:
        from py_api.triage import router as triage_router
        diag["triage_router"] = "loaded"
    except Exception as e:
        diag["triage_router_error"] = str(e)
        diag["traceback"] = traceback.format_exc()
        return JSONResponse(status_code=500, content=diag)
    
    return diag

# Import and register routers
try:
    from py_api.triage import router as triage_router
    from py_api.chat import router as chat_router
    from py_api.consent import router as consent_router
    from py_api.memory import router as memory_router
    
    # Register routers with /api/v2 prefix since Vercel preserves the full path
    app.include_router(triage_router, prefix="/api/v2/triage", tags=["triage"])
    app.include_router(chat_router, prefix="/api/v2/chat", tags=["chat"])
    app.include_router(consent_router, prefix="/api/v2/consent", tags=["consent"])
    app.include_router(memory_router, prefix="/api/v2/memory", tags=["memory"])
    
    print("✅ All routers loaded successfully")
except Exception as e:
    print(f"❌ Router import failed: {e}")
    traceback.print_exc()
    
    # Create a fallback error route
    @app.api_route("/api/v2/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def fallback_error(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Router initialization failed",
                "detail": str(e),
                "path_requested": path,
                "traceback": traceback.format_exc()
            }
        )

# Vercel serverless handler
handler = Mangum(app, lifespan="off")
