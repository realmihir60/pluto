from typing import List, Set, Dict, Any, Optional
from .knowledge import MEDICAL_RULES, SYMPTOMS_DB

class RuleEngine:
    @staticmethod
    def assess(symptoms: List[str]) -> Dict[str, Any]:
        """
        Main entry point for assessment.
        Mirrors the logic in TypeScript exactly.
        """
        active_symptom_ids: Set[str] = set()

        for input_val in symptoms:
            lower_input = input_val.lower()
            
            # Check for direct ID match
            for sym in SYMPTOMS_DB:
                if sym["id"] == lower_input:
                    active_symptom_ids.add(sym["id"])
                    break
                # Pattern match
                if any(p.lower() in lower_input for p in sym["patterns"]):
                    active_symptom_ids.add(sym["id"])

        # Evaluate Rules
        for rule in MEDICAL_RULES:
            if rule["confidence"] == "exclude":
                continue
            
            if RuleEngine.evaluate_rule(rule, active_symptom_ids):
                return {
                    "status": "success",
                    "triage_level": rule["triage_level"],
                    "matched_rules": [rule["id"]],
                    "risk_factors": list(active_symptom_ids),
                    "guidance": rule["message"],
                }

        # Fallback
        return {
            "status": "no_match",
            "triage_level": "info",
            "matched_rules": [],
            "risk_factors": list(active_symptom_ids),
            "guidance": "No specific deterministic pattern matched.",
        }

    @staticmethod
    def evaluate_rule(rule: Dict[str, Any], active_symptoms: Set[str]) -> bool:
        conditions = rule["conditions"]

        # Check ALL
        if "all" in conditions:
            for required in conditions["all"]:
                if required not in active_symptoms:
                    return False

        # Check NONE
        if "none" in conditions:
            for forbidden in conditions["none"]:
                if forbidden in active_symptoms:
                    return False

        # Check ANY
        if "any" in conditions:
            any_match = any(s in active_symptoms for s in conditions["any"])
            if not any_match:
                return False

        return True
