import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, create_engine, select
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment")

# For Supabase/PostgreSQL with PGBouncer, we might need some extra params
engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    print("[Production] Validating service dependencies...")
    try:
        with Session(engine) as session:
            # Simple check to verify DB connectivity
            session.exec(select(1)).first()
            print("DB Status: OK")
    except Exception as e:
        print(f"DB Status: ERROR ({e})")
    yield

app = FastAPI(lifespan=lifespan)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Allow CORS for Next.js frontend
# In production, this should be restricted to the specific frontend URL
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    # Production health check returns rich status
    return {
        "status": "healthy",
        "service": "pluto-backend-python",
        "environment": os.getenv("ENV", "production")
    }

# Import routes
from .api import triage, chat
app.include_router(triage.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
