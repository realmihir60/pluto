# Pluto Health: System Overview & Technical Specification

**Role**: Senior Staff Engineer Documentation  
**Status**: Production-Ready (Vercel Unified)  
**Architecture**: Vercel Serverless (Next.js Frontend + Python Brain API)

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
2.  **Vercel Routing**: Vercel maps request to `api/triage.py` (Python Serverless Function).
3.  **Unified Auth**: Python `get_current_user` dependency extracts `authjs.session-token` from cookies and validates against Supabase.
4.  **Sanitization/PII Scrubbing**: `python_core/sanitizer.py` runs regex and adversarial leads-in scrubbing.
5.  **Deterministic Scan**: `python_core/rule_engine.py` checks for "Crisis" keywords or patterns. 
6.  **AI Augmentation**: Prompt is enriched and sent to Groq (Llama 3.3).
7.  **Logic Snapshot**: The complete state is captured.
8.  **Persistence**: `TriageEvent` is saved to Supabase directly from Python.
9.  **Egress**: Flattened clinical assessment returned to frontend.

---

### Vercel API Layer (`/api`)
- `api/triage.py`: Main triage orchestration and snapshotting.
- `api/chat.py`: Clinical education chat with background memory extraction.
- `api/consent.py`: Legal disclaimer persistence.
- `api/memory.py`: Explicit medical fact extraction handler.

### Core Logic (`/python_core`)
- `python_core/models.py`: SQLModel specs (Shared between all API functions).
- `python_core/rule_engine.py`: Deterministic boolean safety logic.
- `python_core/sanitizer.py`: Multi-pass PII scrubber.
- `python_core/auth.py`: Session extraction and consent enforcement.

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
