# Pluto Health 🏥

> **Intelligence-Led Clinical Triage Engine with Secure Memory** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-green)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.31-blue)](https://sqlmodel.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🌟 Overview

Pluto Health is a premium clinical triage system that leverages **proprietary symptom intelligence** and **state-of-the-art UI/UX** to generate professional-grade medical assessments. Built with a **Hybrid Micro-service** architecture, it features an immersive, lag-free full-screen chat experience.

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
- **Design System**: Framer Motion (High-performance animations), Tailwind CSS (Premium glassmorphism), Lucide React.

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

2. **Install Frontend Dependencies**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Setup Python Backend**
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate virtual environment
   source venv/bin/activate  # On macOS/Linux
   # OR
   venv\Scripts\activate     # On Windows
   
   # Install Python dependencies
   pip install -r requirements.txt
   pip install uvicorn python-dotenv
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
   DIRECT_URL="postgresql://user:password@host:port/database"
   AUTH_SECRET="your_secret_key_here"
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

5. **Run Development Servers**
   
   You need to run **two separate terminals**:
   
   **Terminal 1 - Frontend (Next.js):**
   ```bash
   npm run dev
   ```
   
   **Terminal 2 - Backend (FastAPI):**
   ```bash
   source venv/bin/activate
   python3 main_api.py
   ```
   
   The app will be available at `http://localhost:3001` (or `3000` if available)

---

## 🔧 Troubleshooting

### Common Issues

**Port 8000 already in use:**
```bash
# Kill existing process on port 8000
lsof -ti:8000 | xargs kill -9
```

**Database connection errors:**
- Ensure your `DATABASE_URL` credentials are correct
- Check that PostgreSQL is running
- Verify the database exists and is accessible

**Missing Python modules:**
```bash
source venv/bin/activate
pip install -r requirements.txt
pip install uvicorn python-dotenv
```

**Prisma Client errors:**
```bash
npx prisma generate
npx prisma db push
```

---

## 📅 Roadmap

- [x] Core Triage Engine
- [x] Python Backend Migration (FastAPI)
- [x] Clinical Audit Trail & Logic Snapshots
- [x] Adversarial PII Scrubbing
- [x] User Authentication & Consent Gate
- [x] Premium UI Refinement & Full-Screen Experience
- [x] Premium UI Refinement & Full-Screen Experience
- [x] Performance Tuning & Mobile Optimization
- [x] Clinical Guardrails & Protocols (Anti-Hallucination)
- [x] "Founder Mode" Telemetry (Time-to-Trust Tracking)
- [ ] Telemedicine Integration

---

## ⚠️ Disclaimer

**Pluto Health is an educational prototype.** This tool is **NOT** a substitute for professional medical advice. Always seek the advice of qualified health providers.

## 📄 License

MIT License. Built with ❤️ for better healthcare accessibility.
