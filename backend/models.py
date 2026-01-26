from typing import Optional, List, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

class User(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, unique=True, index=True)
    email_verified: Optional[datetime] = Field(default=None, alias="emailVerified")
    image: Optional[str] = None
    password: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    medical_facts: List["MedicalFact"] = Relationship(back_populates="user")
    triage_events: List["TriageEvent"] = Relationship(back_populates="user")
    profile: Optional["PatientProfile"] = Relationship(back_populates="user")

class PatientProfile(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="user.id", unique=True)
    dob: Optional[datetime] = None
    sex: Optional[str] = None
    heightCm: Optional[int] = None
    weightKg: Optional[int] = None
    bloodType: Optional[str] = None

    user: User = Relationship(back_populates="profile")

class MedicalFact(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="user.id")
    type: str
    value: str
    meta: Optional[Any] = Field(default={}, sa_column=Column(JSON))
    confidence: str = Field(default="Reported")
    source: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="medical_facts")

class TriageEvent(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    userId: str = Field(foreign_key="user.id")
    symptoms: str
    aiResult: Any = Field(default={}, sa_column=Column(JSON))
    actionRecommended: str
    urgency: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="triage_events")
