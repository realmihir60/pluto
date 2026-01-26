from typing import List, Dict, Optional, Literal, Set
from pydantic import BaseModel

CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "want to die",
    "end my life",
    "chest pain",
    "crushing chest",
    "heart stopped",
    "can't breathe",
    "difficulty breathing",
    "choking",
    "stroke",
    "face drooping",
    "arm weakness",
    "slurred speech",
    "seizure",
    "convulsing",
    "unconscious",
    "passed out",
    "severe bleeding",
    "lost a lot of blood",
]

SYMPTOMS_DB = [
    {
        "id": "headache",
        "name": "Headache",
        "patterns": [
            "head hurts",
            "headache",
            "throbbing head",
            "migraine",
            "temple pain",
        ],
    },
    {
        "id": "fever",
        "name": "Fever",
        "patterns": [
            "fever",
            "high temp",
            "temperature",
            "chills",
            "feeling hot",
            "shivering",
        ],
    },
    {
        "id": "neck_stiffness",
        "name": "Neck Stiffness",
        "patterns": [
            "stiff neck",
            "neck pain",
            "can't move neck",
            "rigid neck",
            "neck stiffness",
        ],
    },
    {
        "id": "vision_change",
        "name": "Vision Changes",
        "patterns": [
            "blurry vision",
            "double vision",
            "cant see",
            "vision loss",
            "aura",
            "flashing lights",
        ],
    },
    {
        "id": "vomiting",
        "name": "Vomiting",
        "patterns": [
            "vomit",
            "throwing up",
            "nausea",
            "puking",
            "sick to stomach",
        ],
    },
    {
        "id": "cough",
        "name": "Cough",
        "patterns": [
            "coughing",
            "dry cough",
            "wet cough",
            "hacking cough",
            "cough",
        ],
    },
    {
        "id": "sore_throat",
        "name": "Sore Throat",
        "patterns": ["throat hurts", "sore throat", "pain swallowing"],
    },
    {
        "id": "rash",
        "name": "Rash",
        "patterns": ["rash", "red skin", "itchy skin", "hives", "spots on skin"],
    },
    {
        "id": "abdominal_pain",
        "name": "Abdominal Pain",
        "patterns": [
            "stomach ache",
            "belly pain",
            "abdominal pain",
            "gut rot",
            "stomach hurts",
        ],
    },
    {
        "id": "diarrhea",
        "name": "Diarrhea",
        "patterns": ["diarrhea", "runny stool", "pooping a lot"],
    },
    {
        "id": "shortness_breath",
        "name": "Shortness of Breath",
        "patterns": [
            "short of breath",
            "winded",
            "can't catch breath",
            "shallow breathing",
            "shortness of breath",
        ],
    },
    {
        "id": "chest_pressure",
        "name": "Chest Pressure",
        "patterns": ["heavy chest", "tight chest", "pressure on chest", "chest pressure"],
    },
    {
        "id": "dizziness",
        "name": "Dizziness",
        "patterns": ["dizzy", "lightheaded", "room spinning", "vertigo"],
    },
]

MEDICAL_RULES = [
    {
        "id": "R001_Meningitis",
        "conditions": {
            "all": ["fever", "neck_stiffness"],
        },
        "triage_level": "urgent",
        "message": "Fever with neck stiffness is a 'Red Flag' for Meningitis. This requires immediate ER evaluation.",
        "confidence": "High (Rule R001)",
    },
    {
        "id": "R002_Stroke",
        "conditions": {
            "all": ["headache", "vision_change"],
        },
        "triage_level": "seek_care",
        "message": "Headache accompanied by sudden vision changes requires neurological evaluation to rule out vascular issues.",
        "confidence": "Medium (Rule R002)",
    },
    {
        "id": "R003_Gastro",
        "conditions": {
            "all": ["vomiting", "diarrhea"],
            "none": ["blood"],
        },
        "triage_level": "home_care",
        "message": "Symptoms suggest viral gastroenteritis (Stomach Flu). Maintain hydration. Seek care if dehydration occurs.",
        "confidence": "High (Rule R003)",
    },
    {
        "id": "R004_URI",
        "conditions": {
            "all": ["cough", "sore_throat"],
            "none": ["shortness_breath"],
        },
        "triage_level": "home_care",
        "message": "Symptoms align with a common Upper Respiratory Infection (Cold). Rest and monitor.",
        "confidence": "High (Rule R004)",
    },
    {
        "id": "R005_Emergency_Chest",
        "conditions": {
            "all": ["chest_pressure", "shortness_breath"],
        },
        "triage_level": "crisis",
        "message": "Chest pressure with shortness of breath is a Critical Pattern. Call Emergency Services (112).",
        "confidence": "Critical (Rule R005)",
    },
    {
        "id": "R006_Migraine",
        "conditions": {
            "all": ["headache", "vision_change", "vomiting"],
        },
        "triage_level": "seek_care",
        "message": "Combination suggests classic Migraine, but rule out other causes due to vision loss.",
        "confidence": "exclude",
    },
]
