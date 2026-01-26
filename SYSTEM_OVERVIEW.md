# Pluto Health: System Overview & Technical Specification

**Role**: Senior Staff Engineer Documentation  
**Status**: Production-Hardened (Phase 3)  
**Architecture**: Hybrid Next.js (Frontend/Proxy) + FastAPI (Clinical Brain)

---

## 1. System Purpose & Non-Goals
### Purpose
To provide a de-identified, safety-first clinical decision support utility that assists users in triaging symptoms and maintaining a longitudinal health vault.

### Non-Goals
- **Diagnosis**: The system explicitly does NOT diagnose. 
- **Medical Advice**: The system does NOT provide treatment instructions.
- **Emergency Service Replacement**: The system is not a substitute for 911/112.

---

## 2. End-to-End Execution Flow (Triage)
1.  **Ingress**: Next.js Client sends POST to `/api/triage`.
2.  **Auth/Consent Proxy**: Next.js Route Handler validates session and proxies request to Python `POST /triage` with `x-session-token`.
3.  **Python Auth Bridge**: FastAPI Middleware validates session against DB and checks `hasConsented` flag.
4.  **Sanitization/PII Scrubbing**: `core/sanitizer.py` runs regex and adversarial leads-in scrubbing.
5.  **Deterministic Scan**: `core/rule_engine.py` checks for "Crisis" keywords or high-confidence medical patterns (e.g., Meningitis). 
6.  **AI Augmentation**: If non-crisis, the prompt is enriched with a "Safety Notice" (if ambiguous) and sent to Groq.
7.  **Logic Snapshot**: The complete state (Rule Engine results + Prompt context) is captured.
8.  **Persistence**: `TriageEvent` is saved to Supabase with `logicSnapshot` and `engineVersion`.
9.  **Egress**: Sanitized clinical report returned to frontend.

---

## 3. File & Module Responsibilities
### Core Logic (Python)
- `backend/main.py`: App initialization and CORS/Middleware.
- `backend/models.py`: SQLModel definitions (Source of Truth for DB schema).
- `backend/core/rule_engine.py`: Boolean logic for symptom IDs.
- `backend/core/sanitizer.py`: Multi-pass PII and Crisis scrubber.
- `backend/core/auth.py`: Session validation and Consent enforcement.

### API Layer
- `backend/api/triage.py`: Main triage orchestration and snapshotting.
- `backend/api/chat.py`: Clinical education chat with context injection.
- `backend/api/memory.py`: Background facts extraction (Chronic conditions/Allergies).

---

## 4. LLM Contract
- **Provider**: Groq (Inference Engine)
- **Model**: `llama-3.3-70b-versatile`
- **Output Format**: `json_object`
- **Temperature**: 0.1 (Precision mode)
- **Failure Mode**: If API timeouts or fails, the system falls back to `core/rule_engine.py` (Rule-based determination).

---

## 5. Decision Logic & Escalation Rules
- **Crisis Trigger**: Immediate escalation to "Emergency Hub" if life-threatening keywords (Stroke, Cardiac) match.
- **Ambiguity Escalation**: If input < 3 words or no rules match, the system triggers "Default Upward" logic, forcing a `seek_care` level even if AI suggests `home_care`.
- **Consent Dead-man Switch**: Any API call without a signed `hasConsented` record in the DB returns `403 Forbidden`.

---

## 6. Data Storage & State
- **Primary DB**: Supabase (PostgreSQL).
- **State Handling**: 
    - `User`: Personal profile + Consent status.
    - `TriageEvent`: Snapshots of the "Brain" at time of incident.
    - `MedicalFact`: Permanent traits extracted from conversation history.

---

## 7. Known Failure Modes & Mitigations
| Failure Mode | Mitigation |
| :--- | :--- |
| **PII Obfuscation** | Multi-pass "My name rhymes with..." adversarial scrubbing. |
| **AI Optimism Bias** | Ambiguity Evaluator forces escalation for vague inputs. |
| **Rule Engine Outdated** | Every event stores a `logicSnapshot` for forensic auditing. |
| **Proxy Timeout** | Next.js returns a 504 and recommends immediate ER if state was 'Processing'. |

---

## 8. Debugging Playbook
### Audit Drill (Legal/Compliance)
If a triage result is questioned:
1. Identify `TriageEvent.id` from DB or logs.
2. Run `python scripts/audit_export.py <id>`.
3. Review the generated `audit_packet.json` to see the exact state of the Rule Engine at that second.

### Connectivity Check
1. Verify `DATABASE_URL` connectivity.
2. Verify `GROQ_API_KEY` usage via `/health` endpoint (checks API readiness).

### Auth Failure
- Check if `x-session-token` header is reaching the Python container.
- Verify `hasConsented` flag in the `User` table for the specific UID.
