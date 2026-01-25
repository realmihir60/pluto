import { CRISIS_KEYWORDS, SYMPTOMS_DB, MEDICAL_RULES } from "./knowledge";
import { AssessmentResult } from "./types";

/**
 * Deterministic Rule Engine
 * NO LLMs. NO APIs. Just Boolean Logic.
 */
export class RuleEngine {
    /**
     * Main entry point for assessment
     */
    static assess(symptoms: string[]): AssessmentResult {
        // 1. Identify active symptom IDs from the input strings/ids
        const activeSymptomIds = new Set<string>();

        // Input might be raw text or IDs.
        // For this engine, we assume the input has already been mapped to IDs OR we map them now.
        // Since the previous system mapped patterns to IDs, let's keep that logic or assume IDs.
        // To be safe, we'll try to match input strings against our known patterns if they aren't IDs.

        for (const input of symptoms) {
            const lowerInput = input.toLowerCase();
            let matched = false;

            // Check if it's a direct ID match
            const directMatch = SYMPTOMS_DB.find((s) => s.id === lowerInput);
            if (directMatch) {
                activeSymptomIds.add(directMatch.id);
                matched = true;
            } else {
                // Pattern match
                for (const sym of SYMPTOMS_DB) {
                    if (sym.patterns.some((p) => lowerInput.includes(p.toLowerCase()))) {
                        activeSymptomIds.add(sym.id);
                        matched = true;
                    }
                }
            }

            // If we provided raw text like "headache", that matches the id.
        }

        // 2. Evaluate Rules
        for (const rule of MEDICAL_RULES) {
            if (rule.confidence === "exclude") continue; // Skip rules marked as exclude (like the Migraine override logic if handled elsewhere, or keep it?)
            // wait, the json had "exclude" for R006. That might mean it should NOT match?
            // Or it means it's an exclusion rule?
            // In the JSON R006 said "Combination suggests classic Migraine... confidence: exclude". 
            // I'll assume for this MVP deterministic engine we want to match positive rules.
            // If "exclude" means "don't use this for positive diagnosis", I'll skip it for now or treat it as seek_care.
            // I'll treat it as valid for now but maybe valid seeking care.

            if (this.evaluateRule(rule, activeSymptomIds)) {
                return {
                    status: "success",
                    triage_level: rule.triage_level,
                    matched_rules: [rule.id],
                    risk_factors: Array.from(activeSymptomIds),
                    guidance: rule.message,
                };
            }
        }

        // 3. Fallback
        return {
            status: "no_match",
            triage_level: "info",
            matched_rules: [],
            risk_factors: Array.from(activeSymptomIds),
            guidance: "No specific deterministic pattern matched.",
        };
    }

    private static evaluateRule(
        rule: typeof MEDICAL_RULES[0],
        activeSymptoms: Set<string>
    ): boolean {
        const { conditions } = rule;

        // Check ALL
        if (conditions.all) {
            for (const required of conditions.all) {
                if (!activeSymptoms.has(required)) return false;
            }
        }

        // Check NONE
        if (conditions.none) {
            for (const forbidden of conditions.none) {
                if (activeSymptoms.has(forbidden)) return false;
            }
        }

        // Check ANY (if we had it)
        if (conditions.any) {
            const anyMatch = conditions.any.some((s) => activeSymptoms.has(s));
            if (!anyMatch) return false;
        }

        return true;
    }
}
