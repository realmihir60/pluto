from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add root directory to path to allow importing py_api
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from py_api.triage import router as triage_router
from py_api.chat import router as chat_router
from py_api.consent import router as consent_router
from py_api.memory import router as memory_router

app = FastAPI(title="Pluto Health API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
# Note: Vercel rewrites /api/* to this app.
# If we deploy as Serverless Function, routes should be relative to where app is mounted?
# Or we handle /api prefix.
# Typically, standard Vercel Python handling works well with simple includes.

app.include_router(triage_router, prefix="/api/triage", tags=["triage"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(consent_router, prefix="/api/consent", tags=["consent"])
app.include_router(memory_router, prefix="/api/memory", tags=["memory"])

@app.get("/api/health")
def health():
    return {"status": "healthy", "env": "vercel"}
