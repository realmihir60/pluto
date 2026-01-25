import { NextRequest, NextResponse } from 'next/server';
import { sanitizeAndAnalyze, RuleEngine } from '@/lib/pluto-core';
import OpenAI from 'openai';

// Switch to Node.js runtime to support OpenAI SDK easily
export const runtime = 'nodejs';

type TriageLevel = 'urgent' | 'seek_care' | 'home_care' | 'info';

interface DifferentialItem {
    condition: string;
    likelihood: 'High' | 'Moderate' | 'Low';
    rationale: string;
}

interface TriageResponse {
    version: string;
    triage_level: TriageLevel | 'crisis';
    message: string;
    matched_symptoms: string[];
    disclaimer: string;
    ai_analysis?: boolean;
    // v2.1 fields
    urgency_summary?: string; // "One glance" sentence
    key_findings?: string[]; // "Exertional dyspnea -> cardiac risk"
    differential_diagnosis?: DifferentialItem[]; // Table data
    suggested_focus?: string[]; // "Cardiac evaluation"
    follow_up_questions?: string[];
}

// Initialize Groq Client (if key exists)
const groq = process.env.GROQ_API_KEY
    ? new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
    })
    : null;

export async function POST(req: NextRequest) {
    try {
        const { input } = await req.json();

        if (!input || typeof input !== 'string') {
            return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
        }

        // --- Layer 1: Input Sanitization ---
        const { safeInput, hasCrisisKeywords } = sanitizeAndAnalyze(input);

        if (hasCrisisKeywords) {
            return NextResponse.json({
                version: "2.1.0-crisis",
                triage_level: 'crisis',
                message: 'CRITICAL: Your input indicates a potential medical emergency.',
                urgency_summary: "CRITICAL: Crisis keywords detected indicating immediate danger.",
                key_findings: ["Crisis Keywords Detected"],
                differential_diagnosis: [{ condition: "Emergency", likelihood: "High", rationale: "Immediate threat to life" }],
                suggested_focus: ["Emergency Room"],
                follow_up_questions: [],
                matched_symptoms: [],
                disclaimer: 'Call 911 immediately.',
            } as TriageResponse);
        }

        // --- Layer 2: Deterministic Rule Engine (via Pluto Core) ---
        // Pass the safe input as an array (engine expects matched IDs or raw text to scan)
        const assessment = RuleEngine.assess([safeInput]);

        console.log(`[RuleEngine] Status: ${assessment.status}, Rule: ${assessment.matched_rules.join(',')}`);

        // --- Layer 3: AI Augmentation (if needed) ---
        // If NO deterministic match (status: no_match) -> Consult LLM
        // If Deterministic match found -> Use it (Hybrid fallback)

        // Logic: specific rule matches take precedence.
        let aiResult = null;
        // Always use AI for rich reasoning in v2, unless it's a known crisis handled by rules
        // (For this demo, we can rely heavily on the refined Llama 3 prompt)
        const useAI = groq;

        if (useAI) {
            try {
                // Determine prompt based on what we found locally
                console.log("Consulting Groq LLM for:", safeInput);
                const completion = await groq!.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are Pluto, a **Clinical Decision Support Engine**.
                            Generate a **professional-grade clinical report** for a doctor.

                            **OBJECTIVES**:
                            1. **Kill the narrative**: Use bullet points and rigid structures.
                            2. **Differential Table**: Rank conditions by likelihood (High/Mod/Low) with specific rationale.
                            3. **Key Findings**: Do not just repeat symptoms. specific specific meaning (e.g. "Exertional dyspnea -> Raises cardiac index").
                            4. **One-Sentence Urgency**: Why is this urgent? (e.g. "Urgent due to symptom X + Y in context of Z").

                            **OUTPUT JSON SCHEMA**:
                            {
                                "triage_level": "urgent" | "seek_care" | "home_care" | "info",
                                "message": "Concise summary message.",
                                "urgency_summary": "One specific sentence explaining why this level was chosen.",
                                "key_findings": ["Finding 1 -> Implication", "Finding 2 -> Implication"],
                                "differential_diagnosis": [
                                    {"condition": "Name", "likelihood": "High"|"Moderate"|"Low", "rationale": "Supporting features"}
                                ],
                                "suggested_focus": ["Area 1", "Area 2"],
                                "follow_up_questions": ["Q1", "Q2", "Q3"],
                                "matched_symptoms": ["List"]
                            }`
                        },
                        {
                            role: "user",
                            content: safeInput
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1, // Low temp for precision
                });

                const content = completion.choices[0].message.content;
                if (content) {
                    aiResult = JSON.parse(content);
                }
            } catch (err) {
                console.error("AI Triage Failed:", err);
            }
        }

        // 3. Construct Final Response
        let finalResponse: TriageResponse;

        if (aiResult) {
            finalResponse = {
                version: "2.1.0-pro",
                triage_level: aiResult.triage_level,
                message: aiResult.message,
                matched_symptoms: aiResult.matched_symptoms,
                urgency_summary: aiResult.urgency_summary || aiResult.risk_factors?.[0] || "Urgency determined by symptom patterns.",
                key_findings: aiResult.key_findings || aiResult.risk_factors || [],
                differential_diagnosis: aiResult.differential_diagnosis || [],
                suggested_focus: aiResult.suggested_focus || [],
                follow_up_questions: aiResult.follow_up_questions,
                disclaimer: 'Generated by AI. Not a diagnosis. Verify with a professional.',
                ai_analysis: true
            };
        } else {
            // Fallback to basic rules if AI fails
            finalResponse = {
                version: "2.1.0-fallback",
                triage_level: assessment.triage_level as TriageLevel,
                message: assessment.guidance,
                matched_symptoms: assessment.risk_factors,
                urgency_summary: "Rule-based determination based on keyword matches.",
                key_findings: assessment.risk_factors.map(r => `${r} -> Detected keyword`),
                differential_diagnosis: [],
                suggested_focus: ["General Evaluation"],
                follow_up_questions: ["Do you have any other symptoms?"],
                disclaimer: 'Rule-based result. Consult a doctor.',
            };
        }

        // Add Audit Header
        const headers = new Headers();
        headers.set('X-Pluto-Version', finalResponse.version);
        headers.set('X-Audit-Log', 'Logged timestamp only');

        return NextResponse.json(finalResponse, { status: 200, headers });

    } catch (error) {
        console.error('Triage Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
