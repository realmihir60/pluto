"""
Pluto Clinical Reasoning Engine v4.0
=====================================
A multi-stage clinical reasoning system with anti-hallucination safeguards.

Architecture:
    Stage 1: Chief Complaint Classification
    Stage 2: Structured Interview (Criteria Matrix)
    Stage 3: Differential Diagnosis with Evidence-Based Decision

Author: Pluto Health Team
"""

import json
import os
from typing import Dict, List, Optional, Any, Literal
from dataclasses import dataclass, field
from enum import Enum

# Load protocols on import
PROTOCOLS_PATH = os.path.join(os.path.dirname(__file__), "clinical_protocols.json")

def load_protocols() -> Dict:
    """Load clinical protocols from JSON file."""
    try:
        with open(PROTOCOLS_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load protocols: {e}")
        return {"triage_protocols": []}

PROTOCOLS = load_protocols()


class UrgencyLevel(str, Enum):
    """Clinical urgency levels in ascending order of severity."""
    HOME_CARE = "home_care"
    MONITOR_FOLLOWUP = "monitor_followup"
    SCHEDULE_APPOINTMENT = "schedule_appointment"
    URGENT = "urgent"
    EMERGENCY = "emergency"


@dataclass
class CriteriaStatus:
    """Status of a single clinical criterion."""
    name: str
    status: Optional[bool] = None  # True=Present, False=Absent, None=Unknown
    evidence: Optional[str] = None  # User's words that led to this determination
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "status": self.status,
            "status_label": "Present" if self.status is True else "Absent" if self.status is False else "Unknown",
            "evidence": self.evidence
        }


@dataclass
class CriteriaMatrix:
    """Tracks all red and green flags for a symptom."""
    protocol_id: str
    symptom_name: str
    red_flags: List[CriteriaStatus] = field(default_factory=list)
    green_flags: List[CriteriaStatus] = field(default_factory=list)
    answered_questions: List[str] = field(default_factory=list)
    
    def get_unresolved_red_flags(self) -> List[CriteriaStatus]:
        """Return red flags that are still unknown."""
        return [c for c in self.red_flags if c.status is None]
    
    def get_present_red_flags(self) -> List[CriteriaStatus]:
        """Return red flags that are confirmed present."""
        return [c for c in self.red_flags if c.status is True]
    
    def get_present_green_flags(self) -> List[CriteriaStatus]:
        """Return green flags that are confirmed present."""
        return [c for c in self.green_flags if c.status is True]
    
    def to_dict(self) -> Dict:
        return {
            "protocol_id": self.protocol_id,
            "symptom_name": self.symptom_name,
            "red_flags": [c.to_dict() for c in self.red_flags],
            "green_flags": [c.to_dict() for c in self.green_flags],
            "summary": {
                "red_flags_present": len(self.get_present_red_flags()),
                "red_flags_unknown": len(self.get_unresolved_red_flags()),
                "green_flags_present": len(self.get_present_green_flags())
            }
        }


@dataclass
class ReasoningResult:
    """Final output from the clinical reasoning engine."""
    chief_complaint: str
    matched_protocols: List[str]
    criteria_matrix: Dict[str, CriteriaMatrix]
    urgency_level: UrgencyLevel
    urgency_rationale: str
    differential_diagnosis: List[Dict]
    follow_up_questions: List[str]
    clinical_summary: str
    what_we_know: List[str]
    what_we_dont_know: List[str]
    anti_hallucination_notes: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "chief_complaint": self.chief_complaint,
            "matched_protocols": self.matched_protocols,
            "criteria_matrix": {k: v.to_dict() for k, v in self.criteria_matrix.items()},
            "urgency_level": self.urgency_level.value,
            "urgency_rationale": self.urgency_rationale,
            "differential_diagnosis": self.differential_diagnosis,
            "follow_up_questions": self.follow_up_questions,
            "clinical_summary": self.clinical_summary,
            "what_we_know": self.what_we_know,
            "what_we_dont_know": self.what_we_dont_know,
            "anti_hallucination_notes": self.anti_hallucination_notes
        }


class ClinicalReasoningEngine:
    """
    Multi-stage clinical reasoning engine.
    
    Stage 1: Classify chief complaint -> Match to protocol(s)
    Stage 2: Build criteria matrix -> Extract evidence from user input
    Stage 3: Generate differential with anti-hallucination safeguards
    """
    
    def __init__(self):
        self.protocols = PROTOCOLS.get("triage_protocols", [])
        self.protocol_map = {p["id"]: p for p in self.protocols}
    
    # =========================================================================
    # STAGE 1: CHIEF COMPLAINT CLASSIFICATION
    # =========================================================================
    
    def classify_chief_complaint(self, user_input: str) -> List[str]:
        """
        Classify user input into one or more protocol IDs.
        Uses keyword matching against symptom names and protocol IDs.
        """
        user_lower = user_input.lower()
        matched = []
        
        # Direct keyword matching - expanded for emergencies
        keyword_map = {
            # Headache
            "headache": "headache",
            "head hurts": "headache",
            "migraine": "headache",
            "worst headache": "headache",
            
            # Chest Pain
            "chest pain": "chest_pain",
            "chest": "chest_pain",
            "heart": "chest_pain",
            "crushing": "chest_pain",
            
            # Abdominal
            "stomach": "abdominal_pain",
            "belly": "abdominal_pain",
            "abdominal": "abdominal_pain",
            
            # Respiratory
            "cough": "cough",
            "breathing": "shortness_of_breath",
            "breath": "shortness_of_breath",
            "breathe": "shortness_of_breath",
            "throat swelling": "shortness_of_breath",
            
            # Fatigue
            "tired": "fatigue",
            "fatigue": "fatigue",
            "exhausted": "fatigue",
            
            # Dizziness / Neuro
            "dizzy": "dizziness",
            "vertigo": "dizziness",
            "lightheaded": "dizziness",
            "faint": "dizziness",
            "passed out": "dizziness",
            
            # STROKE / NEURO (Critical additions)
            "face drooping": "dizziness",
            "face is drooping": "dizziness",
            "drooping": "dizziness",
            "can't lift my arm": "dizziness",
            "arm won't work": "dizziness",
            "slurring": "dizziness",
            "can't speak": "dizziness",
            "numbness": "dizziness",
            "weakness": "dizziness",
            "numb": "dizziness",
            "weak": "dizziness",
            
            # Back Pain
            "back pain": "back_pain",
            "back hurts": "back_pain",
            "back": "back_pain",
            
            # Fever
            "fever": "fever",
            "temperature": "fever",
            "chills": "fever",
            
            # Rash
            "rash": "rash",
            "skin": "rash",
            
            # Leg Pain / DVT
            "leg pain": "leg_pain",
            "leg swelling": "leg_pain",
            "calf": "leg_pain",
            "swollen leg": "leg_pain",
            "flight": "leg_pain",  # DVT risk
            "swelling": "leg_pain",
            
            # Throat
            "throat": "throat_pain",
            "sore throat": "throat_pain",
            
            # Urinary
            "urinate": "urinary_symptoms",
            "pee": "urinary_symptoms",
            "bladder": "urinary_symptoms",
            
            # Vision
            "vision": "vision_changes",
            "eye": "vision_changes",
            "can't see": "vision_changes",
            
            # Anxiety
            "anxious": "anxiety_panic",
            "panic": "anxiety_panic",
            "anxiety": "anxiety_panic",
            
            # Nausea
            "nausea": "nausea_vomiting",
            "vomit": "nausea_vomiting",
            "throwing up": "nausea_vomiting",
            
            # Cauda Equina / Bladder-Bowel
            "can't control my bladder": "back_pain",
            "incontinence": "back_pain",
            "bowel": "back_pain",
        }
        
        for keyword, protocol_id in keyword_map.items():
            if keyword in user_lower and protocol_id not in matched:
                matched.append(protocol_id)
        
        # If no match, return empty (will trigger generic response)
        return matched if matched else ["unknown"]
    
    # =========================================================================
    # STAGE 2: BUILD CRITERIA MATRIX
    # =========================================================================
    
    def build_criteria_matrix(self, protocol_ids: List[str]) -> Dict[str, CriteriaMatrix]:
        """
        For each matched protocol, create a criteria matrix with
        all red and green flags initialized to Unknown status.
        """
        matrices = {}
        
        for pid in protocol_ids:
            if pid not in self.protocol_map:
                continue
            
            protocol = self.protocol_map[pid]
            matrix = CriteriaMatrix(
                protocol_id=pid,
                symptom_name=protocol["symptom"],
                red_flags=[CriteriaStatus(name=rf) for rf in protocol.get("red_flags", [])],
                green_flags=[CriteriaStatus(name=gf) for gf in protocol.get("green_flags", [])]
            )
            matrices[pid] = matrix
        
        return matrices
    
    def extract_evidence_from_input(
        self, 
        user_input: str, 
        criteria_matrix: Dict[str, CriteriaMatrix]
    ) -> Dict[str, CriteriaMatrix]:
        """
        Parse user input to extract evidence for criteria.
        This is a keyword-based extraction with comprehensive patterns.
        """
        user_lower = user_input.lower()
        
        # Comprehensive pattern matching for clinical criteria
        presence_patterns = {
            # Headache patterns
            "thunderclap": ["suddenly", "instant", "thunderclap", "worst ever", "came on fast", "like a bomb", "explosion", "worst headache"],
            "fever": ["fever", "temperature", "hot", "chills", "burning up", "high fever"],
            "neck stiffness": ["stiff neck", "neck stiff", "can't move neck", "neck hurts", "neck feels stiff", "can't look down", "neck is so stiff"],
            "sudden onset": ["suddenly", "sudden", "instantly", "all of a sudden", "out of nowhere"],
            
            # Chest pain patterns
            "exertional": ["walking", "climbing", "exert", "activity", "exercise", "stairs", "when i move", "when i walk"],
            "sweating": ["sweat", "sweaty", "diaphoresis", "cold sweat", "drenched", "sweating a lot"],
            "radiation": ["left arm", "arm hurts", "radiates", "goes to my back", "between shoulders", "jaw pain"],
            "crushing": ["crushing", "pressure", "squeezing", "elephant on chest", "tight"],
            "reproducible": ["when i press", "when i touch", "tender to touch", "point to spot", "press on this"],
            
            # Breathing patterns
            "shortness of breath": ["short of breath", "can't breathe", "breathing hard", "winded", "gasping", "hard to breathe"],
            "dyspnea": ["catch my breath", "out of breath", "breathing difficulty"],
            "throat swelling": ["throat is swelling", "throat swelling", "can't swallow"],
            
            # STROKE patterns - These must match "Neurological symptoms" red flag
            "neurological": ["face is drooping", "face drooping", "drooping", "can't lift my arm", "arm is weak", "slurring", "can't speak", "one side", "lopsided", "arm won't work", "can't move my arm"],
            "face droop": ["face is drooping", "face drooping", "drooping on one side", "side of my face", "lopsided"],
            "arm weakness": ["can't lift my arm", "arm is weak", "can't move my arm", "arm won't work", "lift my arm"],
            "speech difficulty": ["slurring", "can't speak", "words wrong", "talking funny", "speech is off"],
            "facial asymmetry": ["lopsided", "one side of face", "face looks different", "drooping on one side"],
            
            # Neurological patterns - Also for protocol matching
            "numbness": ["numb", "numbness", "tingling", "pins and needles", "can't feel"],
            "weakness": ["weak", "weakness", "can't move", "heavy arm", "heavy leg", "drop things", "legs are getting weak", "getting weak", "can't lift"],
            "vision change": ["blurry", "can't see", "seeing spots", "flashing", "double vision", "vision loss"],
            
            # Bladder/Bowel - MUST match "Bladder/bowel incontinence" red flag
            "bladder": ["can't control my bladder", "bladder", "incontinence", "wet myself", "peeing myself", "control my bladder"],
            "incontinence": ["incontinence", "can't control", "wet myself", "soiled myself"],
            "bowel": ["can't control my bowel", "bowel", "soiled myself"],

            
            # Pain patterns
            "pain worse with movement": ["hurts when i move", "worse with movement", "pain with cough", "hurts to cough"],
            "pain at rest": ["hurts all the time", "constant pain", "even when sitting", "even lying down"],
            "severe pain": ["worst pain", "unbearable", "10 out of 10", "excruciating", "terrible", "hurts really bad"],
            
            # GI patterns  
            "blood in stool": ["blood in stool", "bloody stool", "black stool", "tarry"],
            "blood in vomit": ["blood in vomit", "vomiting blood", "coffee ground"],
            "pain before vomit": ["pain first", "pain then vomit", "hurt before i threw up", "started hurting", "then i threw up"],
            
            # Systemic patterns
            "weight loss": ["losing weight", "weight loss", "lost weight", "clothes loose", "lost 15 pounds"],
            "night sweats": ["night sweats", "soaking sheets", "wake up wet"],
            "syncope": ["fainted", "passed out", "blacked out", "lost consciousness"],
            
            # DVT patterns
            "leg swelling": ["leg is swollen", "calf is swollen", "swollen leg", "swelling", "one leg swollen"],
            "recent immobility": ["long flight", "12 hour flight", "just got back from", "sitting for hours", "car ride"],
            "unilateral": ["one leg", "left leg", "right leg", "one calf", "left calf", "right calf"],
            
            # Cauda Equina patterns (EMERGENCY)
            "bladder dysfunction": ["can't control my bladder", "incontinence", "wet myself", "peeing myself"],
            "bowel dysfunction": ["can't control my bowel", "soiled myself"],
            "saddle numbness": ["numb in groin", "can't feel groin", "saddle area"],
            
            # Anxiety/Panic (often benign) - helps de-escalate
            "panic known": ["panic attack", "this happens when", "i'm stressed", "anxiety", "anxious", "happens before"],
            "reproducible by stress": ["when i'm stressed", "when i'm anxious", "during panic"],
            
            # ORTHOSTATIC (benign)
            "positional": ["when i stand up", "stand up too fast", "getting up from bed", "only when i stand"],
        }

        
        for protocol_id, matrix in criteria_matrix.items():
            for criterion in matrix.red_flags + matrix.green_flags:
                criterion_lower = criterion.name.lower()
                
                # Check each pattern category
                for pattern_name, patterns in presence_patterns.items():
                    # Check if this pattern relates to this criterion
                    if pattern_name in criterion_lower or any(p in criterion_lower for p in patterns[:2]):
                        for p in patterns:
                            if p in user_lower:
                                criterion.status = True
                                criterion.evidence = f"User mentioned: '{p}'"
                                break
                
                # Direct name matching fallback
                if criterion.status is None:
                    for word in criterion_lower.split():
                        if len(word) > 4 and word in user_lower:
                            criterion.status = True
                            criterion.evidence = f"Matched keyword: '{word}'"
                            break
        
        return criteria_matrix
    
    # =========================================================================
    # STAGE 3: DIFFERENTIAL DIAGNOSIS WITH ANTI-HALLUCINATION
    # =========================================================================
    
    def generate_follow_up_questions(
        self, 
        criteria_matrix: Dict[str, CriteriaMatrix],
        max_questions: int = 3
    ) -> List[str]:
        """
        Generate targeted follow-up questions based on unresolved red flags.
        Prioritizes questions that help rule out serious conditions.
        """
        questions = []
        
        for protocol_id, matrix in criteria_matrix.items():
            if protocol_id not in self.protocol_map:
                continue
            
            protocol = self.protocol_map[protocol_id]
            must_ask = protocol.get("must_ask_questions", [])
            
            # Filter out already-answered questions
            for q in must_ask:
                if q not in matrix.answered_questions and q not in questions:
                    questions.append(q)
                    if len(questions) >= max_questions:
                        return questions
        
        return questions
    
    def _check_safety_overrides(self, user_input: str) -> tuple[UrgencyLevel | None, str | None]:
        """
        SAFETY-CRITICAL: Hard rules that OVERRIDE normal urgency computation.
        These are non-negotiable escalations for high-risk populations and patterns.
        
        Returns (urgency_level, rationale) if override applies, else (None, None)
        """
        user_lower = user_input.lower()
        
        # =======================================================================
        # RULE 1: TIA / RESOLVED NEURO SYMPTOMS → EMERGENCY
        # "Fine now" or "resolved" does NOT reduce urgency for neuro symptoms
        # =======================================================================
        tia_patterns = [
            ("couldn't speak", "resolved speech difficulty"),
            ("couldn't talk", "resolved speech difficulty"),
            ("speech was slurred", "resolved speech difficulty"),
            ("couldn't see", "resolved vision loss"),
            ("vision went", "resolved vision loss"),
            ("face was drooping", "resolved facial droop"),
            ("arm went weak", "resolved arm weakness"),
            ("couldn't move", "resolved motor symptoms"),
            ("fine now", None),  # Modifier
            ("went away", None),
            ("resolved", None),
            ("got better", None),
        ]
        
        neuro_symptoms = ["speak", "speech", "talk", "vision", "see", "droop", "weak", "numb", "move"]
        resolved_markers = ["fine now", "went away", "resolved", "got better", "passed", "only for", "for a few minutes"]
        
        has_neuro = any(ns in user_lower for ns in neuro_symptoms)
        has_resolved = any(rm in user_lower for rm in resolved_markers)
        
        if has_neuro and has_resolved:
            return UrgencyLevel.EMERGENCY, "⚠️ SAFETY OVERRIDE: Resolved neurological symptoms = TIA pattern. Requires IMMEDIATE evaluation."
        
        # =======================================================================
        # RULE 2: INFANTS (<6 months, <1 year) → URGENT MINIMUM
        # Infants do NOT get benefit of doubt. Feeding/behavior change = escalate.
        # =======================================================================
        infant_markers = ["infant", "baby", "month-old", "months old", "newborn", "month old"]
        infant_concerns = ["crying", "eating less", "not eating", "feeding", "fussy", "lethargic", "sleepy", "won't eat"]
        
        is_infant = any(im in user_lower for im in infant_markers)
        has_infant_concern = any(ic in user_lower for ic in infant_concerns)
        
        if is_infant and has_infant_concern:
            return UrgencyLevel.URGENT, "⚠️ SAFETY OVERRIDE: Infant with feeding/behavior change. Requires prompt evaluation - do not delay."
        
        # =======================================================================
        # RULE 3: ELDERLY (65+) + COGNITIVE/BEHAVIORAL CHANGE → URGENT
        # "Not myself" in elderly = medical emergency until proven otherwise
        # =======================================================================
        elderly_ages = ["65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", 
                        "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "elderly", "senior"]
        cognitive_changes = ["not myself", "confused", "confusion", "not acting right", "different today", 
                            "hard to explain", "foggy", "can't think", "disoriented", "acting strange"]
        
        is_elderly = any(ea in user_lower for ea in elderly_ages)
        has_cognitive = any(cc in user_lower for cc in cognitive_changes)
        
        if is_elderly and has_cognitive:
            return UrgencyLevel.URGENT, "⚠️ SAFETY OVERRIDE: Elderly patient with acute mental status change. Requires urgent evaluation."
        
        # =======================================================================
        # RULE 4: ORTHOPNEA + AGE > 55 → URGENT
        # Breathing worse lying down in older adult = cardiac until proven otherwise
        # =======================================================================
        orthopnea_markers = ["lying down", "when lying", "in bed", "at night", "flat"]
        breathing_markers = ["breathing", "breath", "breathe"]
        older_ages = ["55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70"]
        
        has_positional_breathing = any(om in user_lower for om in orthopnea_markers) and any(bm in user_lower for bm in breathing_markers)
        is_older = any(oa in user_lower for oa in older_ages + elderly_ages)
        
        if has_positional_breathing and is_older:
            return UrgencyLevel.URGENT, "⚠️ SAFETY OVERRIDE: Orthopnea in older adult. Requires cardiac evaluation."
        
        # =======================================================================
        # RULE 5: DVT RISK FACTORS → URGENT
        # Flight + leg pain/swelling = DVT until proven otherwise
        # =======================================================================
        dvt_risk = ["flew", "flight", "plane", "long drive", "car ride", "road trip", "immobile", "sitting for hours"]
        dvt_symptoms = ["leg", "calf", "swelling", "swollen", "pain", "cramping"]
        
        has_dvt_risk = any(dr in user_lower for dr in dvt_risk)
        has_dvt_symptom = any(ds in user_lower for ds in dvt_symptoms)
        
        if has_dvt_risk and has_dvt_symptom:
            return UrgencyLevel.URGENT, "⚠️ SAFETY OVERRIDE: Leg symptoms after immobility. DVT risk - requires urgent evaluation."
        
        # =======================================================================
        # RULE 6: SWEATING + TREMOR + ADULT → URGENT (not HOME_CARE)
        # Could be hypoglycemia, withdrawal, cardiac arrhythmia
        # =======================================================================
        diaphoresis = ["sweaty", "sweating", "sweat", "clammy"]
        tremor = ["shaky", "shaking", "tremor", "trembling", "jittery"]
        adult_markers = ["40", "45", "50", "55", "60", "since this morning", "since morning", "all day"]
        
        has_sweating = any(d in user_lower for d in diaphoresis)
        has_tremor = any(t in user_lower for t in tremor)
        suggests_adult = any(am in user_lower for am in adult_markers) or not is_infant
        
        if has_sweating and has_tremor and suggests_adult:
            return UrgencyLevel.URGENT, "⚠️ SAFETY OVERRIDE: Diaphoresis + tremor requires glucose/cardiac evaluation. Cannot home-care."
        
        return None, None
    
    def compute_urgency_level(
        self, 
        criteria_matrix: Dict[str, CriteriaMatrix],
        user_input: str = ""
    ) -> tuple[UrgencyLevel, str]:
        """
        Determine urgency level based on criteria matrix AND safety overrides.
        
        Rules (in order of priority):
        0. SAFETY OVERRIDES (age, TIA, high-risk populations) - ALWAYS check first
        1. If CRITICAL red flag is PRESENT -> EMERGENCY
        2. If ANY red flag is PRESENT -> URGENT
        3. If green flags present AND explicit safety exclusions -> HOME_CARE (VERY HARD TO EARN)
        4. If insufficient information -> MONITOR_FOLLOWUP (ask more questions)
        """
        
        # FIRST: Check hard safety overrides
        override_level, override_rationale = self._check_safety_overrides(user_input)
        if override_level is not None:
            return override_level, override_rationale
        
        # THEN: Normal criteria-based assessment
        has_red_flag = False
        has_critical_red_flag = False
        rationale_parts = []
        
        critical_patterns = [
            # Immediate life threats (must match as SUBSTRINGS of red flag names)
            "thunderclap", "syncope", "unconscious", "seizure", 
            "can't breathe", "crushing", "worst ever", "sudden vision",
            
            # STROKE/NEURO - matches "Neurological symptoms (weakness, vision loss, slurred speech)"
            "neurological", "neurological symptoms",
            
            # Cauda equina - matches "Bladder/bowel incontinence" and "Progressive motor weakness"
            "bladder", "bowel", "incontinence", "progressive motor",
            
            # Anaphylaxis
            "throat swelling", "airway",
            
            # Meningitis
            "fever with neck", "stiffness",
        ]
        
        for protocol_id, matrix in criteria_matrix.items():
            present_red_flags = matrix.get_present_red_flags()
            
            if present_red_flags:
                has_red_flag = True
                for rf in present_red_flags:
                    rationale_parts.append(f"⚠️ {rf.name}")
                    # Check if it's a critical pattern
                    if any(cp in rf.name.lower() for cp in critical_patterns):
                        has_critical_red_flag = True
        
        # Determine urgency based on PRESENT flags only
        if has_critical_red_flag:
            return UrgencyLevel.EMERGENCY, "Critical red flag detected: " + ", ".join(rationale_parts)
        elif has_red_flag:
            return UrgencyLevel.URGENT, "Red flags present: " + ", ".join(rationale_parts)
        else:
            # HOME_CARE is now VERY HARD TO EARN
            # Must have green flags AND no concerning patterns in input
            total_green = sum(len(m.get_present_green_flags()) for m in criteria_matrix.values())
            
            # Check for any concerning keywords that block HOME_CARE
            user_lower = user_input.lower()
            home_care_blockers = [
                "worse", "worsening", "new", "sudden", "severe", "worst",
                "can't", "unable", "difficulty", "hard to",
                "chest", "heart", "breathing", "vision", "speech", "weak",
                "sweaty", "fever", "blood", "faint", "dizzy"
            ]
            
            has_blocker = any(hcb in user_lower for hcb in home_care_blockers)
            
            if total_green > 0 and not has_blocker:
                return UrgencyLevel.HOME_CARE, f"{total_green} reassuring sign(s) present, no red flags, no concerning patterns"
            else:
                # Default: Need more information
                return UrgencyLevel.MONITOR_FOLLOWUP, "Need more information to assess - please answer follow-up questions"
    
    def get_differential_diagnosis(
        self,
        protocol_ids: List[str],
        criteria_matrix: Dict[str, CriteriaMatrix]
    ) -> List[Dict]:
        """
        Get relevant differential diagnoses from matched protocols.
        Filtered based on evidence in criteria matrix.
        """
        differentials = []
        
        for pid in protocol_ids:
            if pid not in self.protocol_map:
                continue
            
            protocol = self.protocol_map[pid]
            for diff in protocol.get("differential_diagnosis", []):
                # Add with evidence strength
                matrix = criteria_matrix.get(pid)
                evidence_strength = "Possible"
                
                if matrix:
                    red_count = len(matrix.get_present_red_flags())
                    green_count = len(matrix.get_present_green_flags())
                    
                    if diff["urgency"] in ["emergency", "urgent"] and red_count > 0:
                        evidence_strength = "High concern"
                    elif diff["urgency"] == "home_care" and green_count > 0 and red_count == 0:
                        evidence_strength = "Likely"
                
                differentials.append({
                    "condition": diff["condition"],
                    "urgency": diff["urgency"],
                    "evidence_strength": evidence_strength
                })
        
        return differentials
    
    # =========================================================================
    # MAIN REASONING FLOW
    # =========================================================================
    
    def reason(self, user_input: str, history: List[str] = None) -> ReasoningResult:
        """
        Main entry point for clinical reasoning.
        
        Args:
            user_input: The user's symptom description
            history: Previous conversation turns (optional)
        
        Returns:
            ReasoningResult with structured clinical assessment
        """
        history = history or []
        combined_input = " ".join(history + [user_input])
        
        # Stage 1: Classify - ALWAYS do this first to get differentials
        protocol_ids = self.classify_chief_complaint(combined_input)
        
        # Handle unknown complaints
        if "unknown" in protocol_ids:
            return ReasoningResult(
                chief_complaint=user_input[:100],
                matched_protocols=[],
                criteria_matrix={},
                urgency_level=UrgencyLevel.MONITOR_FOLLOWUP,
                urgency_rationale="Unable to match to known clinical pattern",
                differential_diagnosis=[],
                follow_up_questions=[
                    "Can you describe your main symptom in more detail?",
                    "Where exactly do you feel the discomfort?",
                    "When did this start?"
                ],
                clinical_summary="I need more information to understand your symptoms better.",
                what_we_know=[],
                what_we_dont_know=["Chief complaint unclear"],
                anti_hallucination_notes=[
                    "Cannot make clinical determination without clear symptom identification"
                ]
            )
        
        # Stage 2: Build and populate criteria matrix
        criteria_matrix = self.build_criteria_matrix(protocol_ids)
        criteria_matrix = self.extract_evidence_from_input(combined_input, criteria_matrix)
        
        # Get differentials and follow-up questions BEFORE checking overrides
        differentials = self.get_differential_diagnosis(protocol_ids, criteria_matrix)
        follow_ups = self.generate_follow_up_questions(criteria_matrix)
        
        # Get chief complaint name
        chief_complaint = protocol_ids[0] if protocol_ids else "unknown"
        if chief_complaint in self.protocol_map:
            chief_complaint = self.protocol_map[chief_complaint]["symptom"]
        
        # Build what we know / don't know
        what_we_know = []
        what_we_dont_know = []
        
        for pid, matrix in criteria_matrix.items():
            for rf in matrix.get_present_red_flags():
                what_we_know.append(f"🔴 {rf.name}: Present ({rf.evidence})")
            for gf in matrix.get_present_green_flags():
                what_we_know.append(f"🟢 {gf.name}: Present ({gf.evidence})")
            for urf in matrix.get_unresolved_red_flags():
                what_we_dont_know.append(f"❓ {urf.name}: Unknown")
        
        # NOW check safety overrides - but WITH all the clinical context
        override_level, override_rationale = self._check_safety_overrides(combined_input)
        if override_level is not None:
            # Safety override triggered - return with override urgency BUT with differentials
            return ReasoningResult(
                chief_complaint=chief_complaint,
                matched_protocols=protocol_ids,
                criteria_matrix=criteria_matrix,
                urgency_level=override_level,
                urgency_rationale=override_rationale,
                differential_diagnosis=differentials,  # Now populated!
                follow_up_questions=[
                    "Please go to an emergency room or urgent care immediately.",
                    "If symptoms worsen, call emergency services (911)."
                ] if override_level == UrgencyLevel.EMERGENCY else follow_ups,
                clinical_summary=override_rationale,
                what_we_know=what_we_know,
                what_we_dont_know=what_we_dont_know,
                anti_hallucination_notes=[
                    "This urgency level was determined by a SAFETY OVERRIDE rule.",
                    "High-risk populations and patterns require immediate escalation."
                ]
            )
        
        # Stage 3: Compute urgency (for normal flow)
        urgency, rationale = self.compute_urgency_level(criteria_matrix, combined_input)
        
        # Anti-hallucination notes
        anti_hallucination = []
        if what_we_dont_know:
            anti_hallucination.append(
                f"Assessment limited: {len(what_we_dont_know)} criteria not yet evaluated"
            )
        if urgency == UrgencyLevel.URGENT and not what_we_know:
            anti_hallucination.append(
                "Defaulting to URGENT due to insufficient information - cannot rule out serious cause"
            )
        
        # Get chief complaint name
        chief_complaint = protocol_ids[0] if protocol_ids else "unknown"
        if chief_complaint in self.protocol_map:
            chief_complaint = self.protocol_map[chief_complaint]["symptom"]
        
        # Clinical summary
        summary = self._generate_summary(chief_complaint, urgency, what_we_know, follow_ups)
        
        return ReasoningResult(
            chief_complaint=chief_complaint,
            matched_protocols=protocol_ids,
            criteria_matrix=criteria_matrix,
            urgency_level=urgency,
            urgency_rationale=rationale,
            differential_diagnosis=differentials,
            follow_up_questions=follow_ups,
            clinical_summary=summary,
            what_we_know=what_we_know,
            what_we_dont_know=what_we_dont_know,
            anti_hallucination_notes=anti_hallucination
        )
    
    def _generate_summary(
        self, 
        complaint: str, 
        urgency: UrgencyLevel, 
        evidence: List[str],
        questions: List[str]
    ) -> str:
        """Generate a human-readable clinical summary."""
        
        if urgency == UrgencyLevel.EMERGENCY:
            return f"Based on your description of {complaint.lower()}, I'm seeing signs that need immediate medical attention. Please seek emergency care right away."
        elif urgency == UrgencyLevel.URGENT:
            return f"Your {complaint.lower()} symptoms warrant prompt medical evaluation. I recommend seeing a healthcare provider today if possible."
        elif urgency == UrgencyLevel.SCHEDULE_APPOINTMENT:
            return f"Your {complaint.lower()} should be evaluated by a healthcare provider. Schedule an appointment within the next few days."
        elif urgency == UrgencyLevel.MONITOR_FOLLOWUP:
            return f"I'd like to ask a few more questions about your {complaint.lower()} to better understand your situation."
        else:
            if evidence:
                return f"Based on what you've told me, your {complaint.lower()} appears manageable at home for now. Watch for any changes."
            else:
                return f"I understand you're experiencing {complaint.lower()}. Let me ask a few questions to help understand your situation better."


# Singleton instance for use in API
reasoning_engine = ClinicalReasoningEngine()


def get_reasoning_engine() -> ClinicalReasoningEngine:
    """Get the singleton reasoning engine instance."""
    return reasoning_engine
