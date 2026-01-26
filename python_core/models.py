from typing import Optional, List, Any
from datetime import datetime
import os
from sqlmodel import SQLModel, Field, Relationship, JSON, Column, create_engine

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

class Session(SQLModel, table=True):
    __tablename__ = "Session"
    id: str = Field(default=None, primary_key=True)
    sessionToken: str = Field(unique=True, index=True)
    userId: str = Field(foreign_key="User.id")
    expires: datetime

class User(SQLModel, table=True):
    __tablename__ = "User"
    id: str = Field(default=None, primary_key=True)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, unique=True, index=True)
    email_verified: Optional[datetime] = Field(default=None, sa_column=Column("emailVerified"))
    image: Optional[str] = None
    password: Optional[str] = None
    has_consented: bool = Field(default=False, sa_column=Column("hasConsented", default=False))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("createdAt", default=datetime.utcnow))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("updatedAt", default=datetime.utcnow, onupdate=datetime.utcnow))

    medical_facts: List["MedicalFact"] = Relationship(back_populates="user")
    triage_events: List["TriageEvent"] = Relationship(back_populates="user")
    profile: Optional["PatientProfile"] = Relationship(back_populates="user")

class PatientProfile(SQLModel, table=True):
    __tablename__ = "PatientProfile"
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="User.id", unique=True)
    dob: Optional[datetime] = None
    sex: Optional[str] = None
    heightCm: Optional[int] = None
    weightKg: Optional[int] = None
    bloodType: Optional[str] = None

    user: User = Relationship(back_populates="profile")

class MedicalFact(SQLModel, table=True):
    __tablename__ = "MedicalFact"
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="User.id")
    type: str
    value: str
    meta: Optional[Any] = Field(default={}, sa_column=Column(JSON))
    confidence: str = Field(default="Reported")
    source: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="medical_facts")

class TriageEvent(SQLModel, table=True):
    __tablename__ = "TriageEvent"
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="User.id")
    symptoms: str
    aiResult: Any = Field(default={}, sa_column=Column("aiResult", JSON))
    engine_version: str = Field(default="2.1.0", sa_column=Column("engineVersion"))
    logic_snapshot: Any = Field(default={}, sa_column=Column("logicSnapshot", JSON))
    actionRecommended: str
    urgency: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="triage_events")
