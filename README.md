# Pluto Health 🏥

> **AI-Powered Clinical Triage Engine with Long-Term Memory** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-green)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.31-blue)](https://sqlmodel.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🌟 Overview

Pluto Health is an intelligent clinical triage system that analyzes patient symptoms and generates professional-grade medical assessments. Built with a **Hybrid Micro-service** architecture, it combines a React/Next.js frontend with a high-performance Python FastAPI clinical brain.

---

## 🚀 Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 (App Router, Server Actions)
- **Clinical Engine**: Python FastAPI (Clinical Logic, PII Scrubbing, Audit Snapshots)
- **Database**: PostgreSQL (Prisma for JS, SQLModel for Python)
- **Authentication**: Auth.js (NextAuth v5) + Python Auth Bridge
- **AI Models**:
  - Groq Llama 3.3 70B (Clinical Reasoning & Fact Extraction)
  - Groq Whisper V3 (Transcription)

---

## 🏗️ Architecture

Pluto uses a **Decoupled Security** model:
1.  **Frontend (Next.js)**: Handles UI, Authentication, and acts as a secure proxy to the clinical engine.
2.  **Clinical Brain (FastAPI)**: Isolated Python service that handles PII scrubbing, deterministic rule matching, and AI orchestration.
3.  **Audit Trail**: Every incident snapshots the raw AI prompts and rule engine state.

For a detailed technical breakdown, see [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md).

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL Database
- Groq API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/realmihir60/pluto.git
   cd pluto
   ```

2. **Frontend Setup (Node.js)**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Backend Setup (Python)**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_key
   DATABASE_URL="postgresql://user:password@localhost:5432/postgres"
   NEXT_PUBLIC_API_URL=http://localhost:8000
   AUTH_SECRET="your_random_secret_key"
   ```

5. **Run the Application**
   - **Start Python Backend**: `cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000`
   - **Start Next.js Frontend**: `npm run dev`

---

## 📅 Roadmap

- [x] Core Triage Engine
- [x] Python Backend Migration (FastAPI)
- [x] Clinical Audit Trail & Logic Snapshots
- [x] Adversarial PII Scrubbing
- [x] User Authentication & Consent Gate
- [ ] Telemedicine Integration

---

## ⚠️ Disclaimer

**Pluto Health is an educational prototype.** This tool is **NOT** a substitute for professional medical advice. Always seek the advice of qualified health providers.

## 📄 License

MIT License. Built with ❤️ for better healthcare accessibility.
