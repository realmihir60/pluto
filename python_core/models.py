from typing import Optional, List, Any
from datetime import datetime
import os
import traceback
from sqlmodel import SQLModel, Field, Relationship, create_engine
from sqlalchemy import Column, JSON, String, Boolean, DateTime

def get_engine():
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            return None
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return create_engine(db_url, pool_pre_ping=True)
    except Exception as e:
        print(f"Engine Init Error: {e}")
        return None

engine = get_engine()

class Session(SQLModel, table=True):
    __tablename__ = "Session"
    id: str = Field(default=None, primary_key=True)
    sessionToken: str = Field(sa_column=Column("sessionToken", String, unique=True, index=True))
    userId: str = Field(sa_column=Column("userId", String, index=True))
    expires: datetime = Field(sa_column=Column("expires", DateTime))

class User(SQLModel, table=True):
    __tablename__ = "User"
    id: str = Field(default=None, primary_key=True)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, unique=True, index=True)
    email_verified: Optional[datetime] = Field(default=None, sa_column=Column("emailVerified", DateTime))
    image: Optional[str] = None
    password: Optional[str] = None
    has_consented: bool = Field(default=False, sa_column=Column("hasConsented", Boolean, default=False))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("createdAt", DateTime, default=datetime.utcnow))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("updatedAt", DateTime, default=datetime.utcnow))

    medical_facts: List["MedicalFact"] = Relationship(back_populates="user")
    triage_events: List["TriageEvent"] = Relationship(back_populates="user")

class MedicalFact(SQLModel, table=True):
    __tablename__ = "MedicalFact"
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(sa_column=Column("userId", String, index=True))
    type: str
    value: str
    meta: Optional[Any] = Field(default={}, sa_column=Column(JSON))
    confidence: str = Field(default="Reported")
    source: str
    createdAt: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("createdAt", DateTime, default=datetime.utcnow))

    user: "User" = Relationship(back_populates="medical_facts")

class TriageEvent(SQLModel, table=True):
    __tablename__ = "TriageEvent"
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(sa_column=Column("userId", String, index=True))
    symptoms: str
    aiResult: Any = Field(default={}, sa_column=Column("aiResult", JSON))
    engineVersion: str = Field(default="2.1.0", sa_column=Column("engineVersion", String))
    logicSnapshot: Any = Field(default={}, sa_column=Column("logicSnapshot", JSON))
    actionRecommended: str = Field(sa_column=Column("actionRecommended", String))
    urgency: str
    createdAt: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("createdAt", DateTime, default=datetime.utcnow))

    user: "User" = Relationship(back_populates="triage_events")
