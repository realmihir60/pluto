# Pluto Health

> **Neuro-Symbolic Clinical Triage Engine with Safety-Critical Override System** - Professional-grade symptom analysis and clinical decision support utility.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-green)](https://fastapi.tiangolo.com/)
[![Clinical Engine](https://img.shields.io/badge/Engine-v4.1.0-blue)](./python_core/clinical_reasoning_engine.py)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Launch_Ready-brightgreen)](https://github.com/realmihir60/pluto)

## Overview

Pluto Health is a **safety-first clinical decision support system** designed to bridge the gap between alarming medical jargon and reassuring, methodical clinical assessment. It utilizes a unique **Neuro-Symbolic** approach: combining deterministic clinical protocols (Symbolic) with the natural language nuance of advanced LLMs (Neural).

### Core Pillars
- **Doctor-Like AI**: Reassuring, patient-centric language that avoids jargon while maintaining clinical authority.
- **Safety-Critical Overrides**: Hard rules for high-risk populations (infants, elderly, TIA patterns) that bypass normal logic.
- **Defensive Architecture**: Multi-layer validation (Safety Overrides -> Rule Engine -> LLM) that always biases towards safety.
- **Privacy by Design**: Automated PII scrubbing and de-identification before any clinical data hits the inference layer.

---

## What's New in v4.2.0 (Polished Release)

### Rich Consultation Interface
- **Smart Text Formatting**: Markdown support for clear, structured clinical questions.
- **Visual Triage Cards**: Immediate visual feedback on Urgency, Key Findings, and Differentials.
- **Natural Interaction**: "Two-Message" system separates hard clinical data from empathetic conversational follow-ups.

### Assessment Reports
- **Automatic PDF Generation**: Downloadable clinical summary generated instantly upon consultation conclusion.
- **Smart Triggers**: System detects conversation end or high-urgency states to prompt report download.
- **Professional Format**: Vercel-ready PDF generation with vector graphics and structured layout.

### Safety Override System (Enhanced)
The Clinical Reasoning Engine now includes **6 hard safety rules** that trigger BEFORE symptom matching:

| Rule | Trigger Pattern | Result |
|------|-----------------|--------|
| **TIA Detection** | Resolved neuro symptoms ("fine now") | EMERGENCY |
| **Infant Safety** | <1 year + feeding/behavior change | URGENT |
| **Elderly Protection** | 65+ + cognitive change | URGENT |
| **Cardiac Alert** | Orthopnea + age >55 | URGENT |
| **DVT Risk** | Flight/immobility + leg symptoms | URGENT |
| **Metabolic Alert** | Sweating + tremor in adult | URGENT |

---

## Architecture: Hybrid Vercel + Python

Pluto operates in a **Hybrid Environment**, deployable to Vercel with a Python Serverless backend.

### System Stack
1.  **Frontend**: Next.js 15 (React 19) with `framer-motion` & `lucide-react`.
2.  **Backend**: FastAPI (Python 3.10+) running as Vercel Serverless Functions (`/api/*`).
3.  **Data Layer**: PostgreSQL (Supabase) + Prisma.
4.  **AI Layer**: Groq Llama 3.3 70B (Orchestrated by Python Engine).

```mermaid
graph TD
    A[Client UI] -->|/api/chat| B[Vercel Serverless (FastAPI)]
    B -->|Clinical Logic| C[Reasoning Engine]
    C -->|Completion| D[Groq LLM]
    B -->|Response| A
```

---

## Quick Start

### 1. Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (Local FastAPI)
./run_local_backend.sh
```

### 2. Vercel Deployment
The project is configured for zero-config Vercel deployment.
- `vercel.json` maps API routes to `api/index.py`.
- `requirements.txt` installs Python dependencies automatically.


---

## Security & Safety Protocol

### Multi-Layer Safety Gate
1. **Safety Overrides**: Hard rules for high-risk populations (infants, elderly, TIA) - CANNOT be bypassed
2. **PII Sanitization**: Every input is scrubbed for name, email, phone before processing
3. **Protocol Matching**: 20+ clinical protocols with 200+ keywords
4. **Criteria Matrix**: 90+ red flags, tracked per symptom
5. **Conservative Bias**: System errs on side of caution (over-triage preferred vs under-triage)
6. **Rate Limiting**: 50 req/hr (auth), 10 req/hr (anon)

---

## Clinical Reasoning Engine v4.1.0 - Validation

The engine has been stress-tested against **54 clinical scenarios** (30 real-world + 24 edge cases).

### Test Statistics
| Metric | Result |
|--------|--------|
| **Stress Test Pass Rate** | 87.5% (21/24) |
| **Emergency Detection** | 5/5 (100%) |
| **Deceptive Critical Cases** | 4/4 (100%) |
| **High-Risk Population Safety** | 6/6 (100%) |
| **Under-Triage Rate** | 0% |

### Urgency Distribution (30 Cases)
| Level | Count | % |
|-------|-------|---|
| EMERGENCY | 5 | 16.7% |
| URGENT | 12 | 40.0% |
| MONITOR | 11 | 36.7% |
| HOME CARE | 2 | 6.7% |

Full test results: [python_core/test.md](./python_core/test.md)

---

## Troubleshooting

- **401 Unauthorized**: Clear browser cookies. JWS requires fresh session after config changes.
- **Port 8000 Conflict**: Run `lsof -ti:8000 | xargs kill -9` to clear stale processes.
- **Rate Limited**: Wait 1 hour or increase limits in `python_core/rate_limiter.py`.

---

## Roadmap

### v4.1.0 (Current - Launch Ready)
- [x] Clinical Reasoning Engine v4.0 with 3-stage protocol matching
- [x] Safety Override System for high-risk populations
- [x] Criteria Matrix with red/green flag tracking
- [x] 54 clinical scenarios validated (87.5% pass rate)
- [x] Legal defensibility: 0% under-triage

### v4.2.0 (Next)
- [ ] Voice Triage via Whisper API
- [ ] Clinical Focus Notes extraction
- [ ] Enterprise Audit logging

---

## Disclaimer

**Pluto Health is for educational purposes only.** It provides preliminary clinical triage and is **NOT** a substitute for professional medical advice, diagnosis, or treatment. In the event of a medical emergency, call emergency services (e.g., 911) immediately.

---

## License
MIT License. Built for the future of decentralized clinical intelligence.

**Status:** Launch Ready | Engine: v4.1.0 | Last Updated: Jan 2026
