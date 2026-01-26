import re
from typing import List, Dict, Any
from dataclasses import dataclass
from .knowledge import CRISIS_KEYWORDS

@dataclass
class SanitizationResult:
    safeInput: str
    hasCrisisKeywords: bool
    detectedCrisisKeywords: List[str]

def sanitize_and_analyze(input_text: str) -> SanitizationResult:
    """
    Layer 1: Edge Sanitization & Crisis Detection
    - Strips PII (Phone, Email, Names, Locations)
    - Detects Identity Obfuscation (e.g. "My name rhymes with...")
    - Detects Crisis Keywords immediately
    """
    safe_input = input_text

    # 1. Strip PII (Standard Patterns)
    # Email Regex
    safe_input = re.sub(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "[EMAIL REDACTED]",
        safe_input
    )

    # Phone Regex (Simple US/Intl format match)
    safe_input = re.sub(
        r'(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}',
        "[PHONE REDACTED]",
        safe_input
    )

    # 2. Adversarial Pattern Recognition (Anti-obfuscation)
    # Match Common Lead-in phrases for PII
    pii_leads = [
        r"my\s+name\s+is\s+[\w\s]+",
        r"call\s+me\s+[\w\s]+",
        r"i\s+live\s+at\s+[\w\s,]+",
        r"my\s+address\s+is\s+[\w\s,]+",
        r"my\s+name\s+rhymes\s+with\s+[\w\s]+",
        r"my\s+email\s+ends\s+in\s+[\w\s\.]+",
    ]
    
    for pattern in pii_leads:
        safe_input = re.sub(pattern, "[PII DETECTED & MASKED]", safe_input, flags=re.IGNORECASE)

    # 3. Crisis Detection
    detected_crisis_keywords: List[str] = []
    lower_input = safe_input.lower()

    for keyword in CRISIS_KEYWORDS:
        if keyword.lower() in lower_input:
            detected_crisis_keywords.append(keyword)

    return SanitizationResult(
        safeInput=safe_input,
        hasCrisisKeywords=len(detected_crisis_keywords) > 0,
        detectedCrisisKeywords=detected_crisis_keywords
    )
