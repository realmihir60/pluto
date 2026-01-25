import { z } from "zod";

export const TriageLevelSchema = z.enum([
    "crisis",
    "urgent",
    "seek_care",
    "home_care",
    "info",
]);

export type TriageLevel = z.infer<typeof TriageLevelSchema>;

export interface MedicalRuleCondition {
    all?: string[];
    any?: string[];
    none?: string[];
}

export interface MedicalRule {
    id: string;
    conditions: MedicalRuleCondition;
    triage_level: TriageLevel;
    message: string;
    confidence: string;
}

export interface AssessmentResult {
    status: "success" | "no_match";
    triage_level: TriageLevel;
    matched_rules: string[];
    risk_factors: string[];
    guidance: string;
}
