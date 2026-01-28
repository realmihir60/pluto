# PLUTO HEALTH: DEEP CONTEXT & SYSTEM ARCHITECTURE REDLINE
**FOR AI AGENT CONSUMPTION ONLY - INTERNAL ENGINEERING TRUTH**

## 1. MISSION CRITICAL PHILOSOPHY
Pluto is not an LLM wrapper. It is a **Neuro-Symbolic Hybrid**. 
- **Symbolic Layer**: Python Rule Engine (`python_core/knowledge.py`) handles deterministic clinical safety.
- **Neural Layer**: LLM (`api/triage.py`) handles nuance and natural language.
- **Law of Escalation**: If Symbolic and Neural layers disagree, or if input is ambiguous, the system **MUST** default to the higher urgency level. Never downrank a risk via AI inference.

---

## 2. INFRASTRUCTURE & DEPLOYMENT STATE
### Pivot Rationale: Standalone -> Vercel Serverless
- **Initial State**: Standalone FastAPI + Gunicorn server in `/backend`.
- **Current State**: Unified Vercel Python Functions in `/api/*.py`.
- **Reason**: Railway/Render free tiers either have "Network Restrictions" (blocking database/Google Maps access) or "Time Limits" (30-day trials). Vercel is chosen for **permanent, unified, zero-cost production**.
- **Constraint**: Vercel Python runtime has a **10-second timeout**. Clinical reasoning flows must be optimized to return in < 8s.

---

## 3. CORE COMPONENT DEEP-DIVE

### A. Authentication Bridge (The "Database Session" Fix)
NextAuth (JS) and Python (Serverless) share the same database. 
- **Strategy**: NextAuth is configured with `strategy: "database"`. This forces it to write session tokens into the PostgreSQL `Session` table.
- **Python Verification**: `python_core/auth.py` extracts the token from cookies and looksups the record in the `Session` table. 
- **Why**: JWT sessions are invisible to Python without complex decryption. Database sessions provide a simple, secure pointer.
- **Cookie Patterns**: The bridge supports `authjs.session-token` and `next-auth.session-token` (including `__Secure-` variants).

### B. Clinical Rule Engine (`python_core/rule_engine.py`)
- **Knowledge Base**: `python_core/knowledge.py` contains `DiagnosticPattern` objects.
- **Ranking**: Matches are sorted by `level`. `crisis` > `urgent` > `seek_care` > `home_care`.
- **The "Logic Snapshot"**: Every triage event saves the `RuleEngine.assess()` result into the `logicSnapshot` JSON column. This is for legal forensic auditing.

### C. Adversarial Safety: We assume users will try to hide PII or enter vague symptoms. The code triages "Upward" (to higher care) by default in these cases.
- **Layer 1**: Standard Regex for Emails and Phone Numbers.
- **Layer 2**: "Lead-in" detection for phrases like "My name rhymes with" or "Call me...". 
- **Internal Action**: It replaces matched patterns with `[PII MASKED]`. Data is scrubbed **BEFORE** hitting the Groq LLM to maintain HIPAA-alignment patterns.

### D. Clinical Topic Guardrail: Pluto is strictly clinical. It must refuse non-medical inputs (cooking, coding, jokes) to prevent liability and resource drain.

### E. Emergency Response Hub
- **Trigger**: Any triage result where `triage_level` is `urgent` or `crisis`.
- **Frontend Effect**: `app/demo/page.tsx` renders a high-visibility red dashboard.
- **External Links**: Hardcoded `tel:911` and Google Maps hospital search.

---

## 4. DATABASE SYNC PROTOCOL (DUAL ORM)
- **Frontend (JS)**: Uses **Prisma**. Schema source: `prisma/schema.prisma`.
- **Backend (Python)**: Uses **SQLModel**. Schema source: `python_core/models.py`.
- **Critical Rule**: If you add a column to `User` or `TriageEvent`, you **MUST** update both files. 
- **Naming Divergence**: Python uses Snake Case (`created_at`) but SQLModel maps them to the Database's Camel Case (`createdAt`) using `sa_column=Column("createdAt")`. 

---

## 5. HALLUCINATION PROTECTION (FOR NEXT AI MODEL)
- **Do not invent API endpoints**: The only Python APIs are `/api/triage`, `/api/chat`, `/api/memory`, and `/api/consent`.
- **Do not use `backend/` folder**: It has been deleted. All Python lives in root `/api` and `/python_core`.
- **Do not change the 10s Timeout logic**: If you add slow libraries (like heavy NLP), the serverless function will die. Keep it lightweight.
- **Explicit ForeignKey Requirement**: When using `sa_column` for camelCase mapping (e.g., `userId`), SQLModel **cannot** automatically infer foreign key relationships. You **MUST** include `ForeignKey("User.id")` directly inside the `Column()` constructor of `sa_column`.
- **Session Bridge**: Always use the `get_consented_user` dependency in FastAPI/Vercel functions to ensure the Legal Gate is active.

---

## 6. DEBUGGING PLAYBOOK
- **If Python API fails**: Check if the root `requirements.txt` contains all dependencies. Vercel needs them at the root.
- **If Auth fails**: Check the Browser Cookies. If `authjs.session-token` is missing, the Python brain will return `401`.
- **If results are "Home Care" when they should be "ER"**: Check `python_core/knowledge.py`. One missing keyword in a rule can cause the AI to down-triage. Fix the **Symbolic Rule** first, not the AI prompt.

---
---

## 7. UI/UX & DESIGN HIERARCHY
- **Aesthetic**: "Precision-led Lux" (inspired by Stripe and Linear). Uses high-fidelity OKLCH values for superior color depth.
- **Visual Vocabulary**: 
  - **Glassmorphism**: Use `glass-morphism` or `glass` classes with high backdrop-blur and low opacity borders.
  - **Trust Markers**: Security labels (AES-256, HIPAA) must be **subtle info-tags**, not button-like. Avoid action fatigue.
- **Action Consolidation**: Navigation for guests should focus on a **single primary action** ("Join Pluto"). Secondary actions like "Log in" should be de-emphasized or integrated to reduce cognitive load.
- **The "Whole-Page" Model**: App routes like `/demo` and `/dashboard` are immersive. **Hide global footers** on these pages to maximize the clinical workspace feel.

---

## 8. PERFORMANCE & LAG-FREE GUARANTEE
- **Blur Cap**: Never exceed `blur-[100px]` for animated background elements. High blur values (120px+) cause significant GPU lag on mobile.
- **Hardware Acceleration**: Always apply `will-change-transform` to animated background blobs. 
- **Transform-Only**: Animations should use `transform: translate/scale` and `opacity`. Avoid animating `width`, `height`, or `margin` as they trigger expensive layout shifts.

---

## 9. Telemetry & Analytics (New)
- **Privacy-First**: No external trackers (Google/Facebook headers removed).
- **Founder Metrics**:
  - `VIEW_LANDING`: Top of funnel.
  - `START_INPUT`: "Time-to-Trust" metric.
  - `SUBMIT_TRIAGE`: Successful conversion.
- **Implementation**: Lightweight `lib/analytics.ts` logging to server `stdout` for zero-latency monitoring.

---

## 10. Clinical Guardrails (The "Anti-Hallucination" Layer)
- **Protocol Database**: Strict JSON rules in `python_core/clinical_protocols.json`.
- **Logic Gates**:
  - **Must-Ask Questions**: The LLM is blocked from diagnosing common symptoms (Headache, Chest Pain) until specific criteria (e.g., "Thunderclap Onset") are ruled out.
  - **Negative Predictive Value (NPV)**: Explicit "Green Flags" that force de-escalation to Home Care.
- **Premature Closure Prevention**: The system proactively hunts for benign mimics (e.g., Migraine vs. SAH) to prevent alarm fatigue.

---

## 11. Performance Optimization
- **Mobile-First GPU**: Glassmorphism effects (`backdrop-blur`) are capped at `12px` (md) to ensure 60FPS on mobile GPUs.
- **Hardware Acceleration**: Background animations force `translateZ(0)` to promote layers.
- **Bundle Hygiene**: Heavy libraries (Charts, Maps) are lazy-loaded or excluded from initial chunks.

---

## 12. Recent UI/UX Changes Log
### Textarea Positioning Fix (2026-01-28)
- **Issue**: The symptom input textarea at `/demo` was positioned too close to the bottom of the viewport, being cut off
- **Root Cause**: Two issues: (1) The textarea container had responsive bottom padding that wasn't consistent, (2) The parent container used `h-screen overflow-hidden` which prevented proper spacing from the viewport bottom
- **Solution**: 
  - Changed textarea container to use fixed `pb-[15px]` for exactly 15px gap from bottom
  - Changed root page container from `h-screen overflow-hidden` to `min-h-screen` to allow proper bottom spacing
- **Files Modified**: 
  - `/app/demo/page.tsx` line 579: Updated textarea container className from `"shrink-0 bg-transparent p-4 md:p-6 pb-8 md:pb-12 mb-6 relative z-20"` to `"shrink-0 bg-transparent p-4 md:p-6 pb-[15px] relative z-20"`
  - `/app/demo/page.tsx` line 396: Updated root container className from `"relative h-screen flex flex-col pt-16 overflow-hidden"` to `"relative min-h-screen flex flex-col pt-16"`
- **Context**: This is part of the glassmorphism floating input design that appears on all states (idle, input, results) of the demo page
- **No Build Required**: Next.js hot-reloads these changes automatically via the dev server

### Dynamic Follow-Up System & Clinical Pivots (2026-01-28)
- **Goal**: Implement intelligent question management where answered questions are removed and new symptom areas are documented as clinical notes.
- **Backend Implementation**:
  - Updated `/api/chat` and `/api/triage` system prompts to track conversation history and detect "multi-system involvement".
  - LLM now removes answered `follow_up_questions` and refines vague ones.
  - Added `clinical_notes` field to response JSON to document "symptom pivots" (e.g., Leg Pain → Blurry Vision) with 3-5 sentences of analysis.
- **Frontend Implementation**:
  - Added `clinical_notes` to `AnalysisResult` type in `app/demo/page.tsx`.
  - Created a professional "Clinical Intelligence Note" section below the differential diagnosis table using a themed card with a `Sparkles` icon and structured font weights.
  - Removed informal quotes/italics for a more authoritative medical assistant tone.
  - Questions are dynamically updated in the UI when the assistant's state changes.
- **Impact**: Improves diagnostic accuracy, reduces redundant questioning, and provides clear transparency when the clinical focus shifts across body systems.

---

## 13. Email Verification System (2026-01-28)
### Security Architecture
Pluto enforces mandatory email verification before platform access to prevent unauthorized accounts.

**Core Flow:**
1. User signs up → Account created with `emailVerified = null`
2. OTP sent via email (6-digit code, 15-minute expiration)
3. User enters code in verification modal
4. On success → `emailVerified` set to current timestamp
5. Login blocked until verified

**Components:**
- **Authentication Gate**: `auth.ts` throws `EMAIL_NOT_VERIFIED` error if `user.emailVerified` is `null`
- **OTP Generation**: `/api/send-verification` creates bcrypt-hashed tokens, stores in `VerificationToken` table
- **OTP Validation**: `/api/verify-email` verifies code, updates `User.emailVerified`, deletes token
- **Frontend Modal**: `components/auth/verify-email-modal.tsx` - 6-digit input with auto-submit
- **Signup Integration**: `app/ui/signup-form.tsx` detects `VERIFICATION_REQUIRED:<email>` response, shows modal
- **Login Handling**: `app/ui/login-form.tsx` catches verification error, provides "Resend" button

**Email Providers (Priority Order):**
1. **Resend** (if `RESEND_API_KEY` set) - Dedicated service
2. **Gmail SMTP** (if `GMAIL_USER` + `GMAIL_APP_PASSWORD` set) - Free, 500 emails/day
3. **Console Logging** (dev fallback) - OTP printed to terminal

**Security Features:**
- OTP codes hashed with bcrypt before database storage
- 15-minute token expiration
- Rate limiting: 3 verification emails per hour per user
- Tokens deleted immediately after successful verification
- Database-level enforcement at auth layer

**Migration Strategy:**
- Existing users auto-verified via `scripts/verify-existing-users.ts`
- New users required to verify before access
- No disruption to current user base

---

---

## 14. Phase 1: Doctor-Like Triage System (2026-01-28)
### The "Simple Language" Revolution
Pluto transformed from alarming technical medical responses to reassuring, methodical doctor-like assessments.

**Core Changes:**

**1. Simple Language Translation**
- **File**: `python_core/simple_language_map.json`
- **Purpose**: Maps medical jargon to everyday terms
- **Examples**:
  - "Syncope" → "passed out" / "fainted"
  - "Vertigo" → "dizzy" / "room spinning"
  - "Dyspnea" → "trouble breathing"
- **Integration**: LLM prompts explicitly avoid technical terms

**2. Assessment Table Format**
- **Structure**: "What We Know" vs "What We Need to Check"
- **Goal**: Transparent reasoning, not black-box diagnosis
- **UI**: Displays as structured table in demo interface
- **Backend**: `assessment_table` object in triage API response

**3. Conservative Questioning Approach**
- **Behavior**: Asks clarifying questions before diagnosing
- **Examples**:
  - "Chest pain" → "Is it sharp or dull?", "Does it hurt when you breathe?"
  - "Headache" → "Sudden or gradual?", "Worst headache ever?"
- **Safety**: Prevents premature closure and false reassurance

**4. Friendly, Reassuring Tone**
- **Old**: "Differential diagnosis includes myocardial infarction"
- **New**: "I'm concerned this could be serious. Let's make sure it's not your heart."
- **Prompts**: System messages emphasize empathy and clarity

**Evidence:**
- `api/triage.py` - Updated system prompts (lines 100-180)
- `python_core/simple_language_map.json` - Medical terminology map
- `phase1_implementation_walkthrough.md` - Complete implementation doc

---

## 15. Beta Production Safety (2026-01-28)
### The "Three Pillars" of Production Hardening
Built comprehensive safety infrastructure for public beta launch.

**Pillar 1: Rate Limiting**
- **File**: `python_core/rate_limiter.py`
- **Limits**: 50 req/hr (authenticated), 10 req/hr (anonymous)
- **Storage**: In-memory with automatic cleanup
- **Protection**: Prevents cost overruns from abuse/bots
- **Status**: Module built, awaiting integration into `api/triage.py`

**Pillar 2: Monitoring & Logging**
- **File**: `python_core/logger.py`
- **Types**: Errors, triage events, performance, access
- **Format**: Structured JSON (`/logs/*.jsonl`)
- **Dashboard**: Admin metrics API at `/api/admin/metrics`
- **Cost**: Zero (in-house, no Sentry)
- **Status**: Module built, awaiting integration

**Pillar 3: Error Handling**
- **File**: `python_core/triage_wrapper.py`
- **Features**:
  - Graceful LLM fallback to rule engine
  - User-friendly error messages
  - Specific guidance per error type (rate limit, API down, DB error)
- **Philosophy**: Never show technical errors to users
- **Status**: Module built, awaiting integration

**Supporting Infrastructure:**
- **Integration Guide**: `INTEGRATION_GUIDE.md` - Copy-paste steps for API integration
- **Deployment Guide**: `DEPLOYMENT.md` - Vercel step-by-step
- **Troubleshooting**: `TROUBLESHOOTING.md` - Common issues & fixes
- **Smoke Tests**: `scripts/smoke-test.sh` - Automated endpoint testing
- **FAQ Page**: `app/(site)/faq/page.tsx` - User-facing help

**Architecture Note:**
All safety modules are standalone and dependency-free. They use in-memory storage for beta (no Redis/external services). For production scaling, consider:
- Upgrading to Vercel KV (Redis) for distributed rate limiting
- Adding external monitoring (Sentry) for advanced features
- Database-backed logging for long-term retention

**Current Version:** 3.0.0-beta  
**Readiness:** 90% (awaiting manual API integration)

---

*End of Context Specification. Maintain the safety-first and performance-first override at all times.*
