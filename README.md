# Pluto Health 🏥

> **Intelligence-Led Clinical Triage Engine with Secure Memory** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-green)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.31-blue)](https://sqlmodel.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🌟 Overview

Pluto Health is an advanced clinical triage system that leverages **proprietary symptom intelligence** to generate professional-grade medical assessments. Built with a **Hybrid Micro-service** architecture, it combines a high-fidelity React interface with a hardened Python clinical brain.

---

## 🚀 Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 (App Router, Server Actions)
- **Clinical Engine**: Python FastAPI (Deterministic Logic, PII Scrubbing, Audit Snapshots)
- **Database**: PostgreSQL (Prisma & SQLModel Integration)
- **Authentication**: Auth.js (NextAuth v5) + Unified Python Bridge
- **Intelligence Layer**:
  - Pluto Clinical reasoning (High-parameter reasoning)
  - Pluto Voice analysis (Deterministic transcription)

---

## 🏗️ Architecture

Pluto uses a **Vercel Unified** model:
1.  **Frontend (React/Next.js)**: The premium clinical interface.
2.  **Clinical Brain (Python Serverless)**: Hardened clinical logic running as Vercel Python Functions in `/api/*.py`.
3.  **Unified Auth**: Shared PostgreSQL session between JS and Python.

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

2. **Unified Setup**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   # Python deps handled automatically by Vercel on push
   ```

3. **Environment Variables**
   Create a `.env` file:
   ```env
   GROQ_API_KEY=your_groq_key
   DATABASE_URL="postgresql://..."
   AUTH_SECRET="..."
   ```

4. **Run Development Server**
   ```bash
   # Both JS and Python APIs run on one command:
   npm run dev
   ```

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
