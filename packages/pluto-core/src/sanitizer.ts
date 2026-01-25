import { CRISIS_KEYWORDS } from "./knowledge";

export interface SanitizationResult {
    safeInput: string;
    hasCrisisKeywords: boolean;
    detectedCrisisKeywords: string[];
}

/**
 * Layer 1: Edge Sanitization & Crisis Detection
 * - Strips PII (Phone, Email)
 * - Detects Crisis Keywords immediately
 */
export function sanitizeAndAnalyze(input: string): SanitizationResult {
    const start = performance.now();
    let safeInput = input;

    // 1. Strip PII
    // Email Regex
    safeInput = safeInput.replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL REDACTED]"
    );

    // Phone Regex (Simple US/Intl format match)
    safeInput = safeInput.replace(
        /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
        "[PHONE REDACTED]"
    );

    // 2. Crisis Detection
    const detectedCrisisKeywords: string[] = [];
    const lowerInput = safeInput.toLowerCase();

    for (const keyword of CRISIS_KEYWORDS) {
        if (lowerInput.includes(keyword.toLowerCase())) {
            detectedCrisisKeywords.push(keyword);
        }
    }

    const end = performance.now();
    // Logging latency might be noisy in server context, keeping it conditional or removing for core lib
    // console.log(`[Guardrail] Latency: ${(end - start).toFixed(4)}ms | Input Length: ${input.length}`);

    return {
        safeInput,
        hasCrisisKeywords: detectedCrisisKeywords.length > 0,
        detectedCrisisKeywords,
    };
}
