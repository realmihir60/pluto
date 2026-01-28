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

app = FastAPI(title="Pluto API v2 Diagnostics")

# Global CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v2/health")
@app.get("/health")
def health():
    diag = {
        "status": "diagnostic_mode",
        "cwd": os.getcwd(),
        "sys_path": sys.path,
        "root_dir": root_dir,
        "files_in_root": os.listdir(root_dir) if os.path.exists(root_dir) else "not_found"
    }
    try:
        from py_api.triage import router as triage_router
        return {"status": "healthy", "version": "2.2.0-diag", "diagnostics": diag}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "import_failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "diagnostics": diag
            }
        )

# Delayed imports for sub-routers to prevent total crash
try:
    from py_api.triage import router as triage_router
    from py_api.chat import router as chat_router
    from py_api.consent import router as consent_router
    from py_api.memory import router as memory_router
    
    app.include_router(triage_router, prefix="/api/v2/triage")
    app.include_router(triage_router, prefix="/triage")
    app.include_router(chat_router, prefix="/api/v2/chat")
    app.include_router(chat_router, prefix="/chat")
    app.include_router(consent_router, prefix="/api/v2/consent")
    app.include_router(consent_router, prefix="/consent")
    app.include_router(memory_router, prefix="/api/v2/memory")
    app.include_router(memory_router, prefix="/memory")
except Exception as e:
    print(f"Sub-router import failed: {e}")

# Vercel entry point
handler = Mangum(app, lifespan="off")
