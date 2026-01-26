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

## 9. MOBILE-FIRST PRINCIPLES
- **Dynamic Spacing**: Use `p-4 md:p-10` patterns. Mobile screens need breathing room but cannot afford the massive whitespace of desktop.
- **Tap Targets**: Ensure footer links and inline actions have a minimum hit area of 44x44px. 
- **Overlay Solidification**: Mobile navigation menus MUST have a near-solid background (`bg-background/95`) to prevent text overlap with underlying hero content.

---
*End of Context Specification. Maintain the safety-first and performance-first override at all times.*
