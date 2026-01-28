# Pluto Health 🏥

> **Intelligence-Led Clinical Triage Engine with Secure Memory** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-green)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.31-blue)](https://sqlmodel.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Public_Beta-orange)](https://github.com/realmihir60/pluto)

## 🌟 Overview

**Pluto Health is in Public Beta** - A friendly, doctor-like clinical triage system that transforms alarming technical medical responses into reassuring, methodical assessments.

Built with a **defensive architecture** featuring:
- **Doctor-Like AI Prompts**: Simple language, assessment tables, conservative approach
- **Multi-Layer Safety**: Rule Engine → ML Ready → LLM with ensemble validation  
- **Rate Limiting**: 50 requests/hour (authenticated), 10/hour (anonymous)
- **In-House Monitoring**: Error tracking, performance metrics, audit trails
- **PII Protection**: Sanitization before AI processing, encrypted storage

---

## 🚀 Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 (App Router, Server Actions)
- **Clinical Engine**: Python FastAPI (Deterministic Logic, PII Scrubbing, Audit Snapshots)
- **Database**: PostgreSQL (Prisma & SQLModel Integration)
- **Authentication**: Auth.js (NextAuth v5) + Unified Python Bridge
- **Intelligence Layer**:
  - Groq Llama 3.3 70B (Doctor-like reasoning with simple language)
  - Whisper API (Voice transcription)
- **Design System**: Framer Motion, Tailwind CSS (Glassmorphism), Lucide React

---

## 🏗️ Architecture

Pluto uses a **Vercel Unified** model with defensive depth:

### Core Layers
1.  **Frontend (React/Next.js)**: Premium clinical interface with glassmorphism design
2.  **Clinical Brain (Python Serverless)**: Hardened clinical logic running as Vercel Python Functions in `/api/*.py`
3.  **Unified Auth**: Shared PostgreSQL session between JS and Python

### Safety Features  
- **Rate Limiting**: In-memory rate limiter prevents abuse (50/1h authenticated, 10/1h anonymous)
- **Error Handling**: Graceful LLM fallback, user-friendly error messages
- **Logging**: Structured JSON logs (errors, performance, triage events)
- **Monitoring**: In-house metrics dashboard (no external dependencies)
- **PII Scrubbing**: Sanitization layer before AI processing

### Clinical Intelligence
- **Rule Engine**: Deterministic crisis keyword detection and pattern matching
- **ML-Ready**: Architecture supports future ML safety layer (see `ml_safety_layer_plan.md`)
- **LLM (Groq Llama 3.3 70B)**: Doctor-like prompts with simple language and assessment tables
- **Ensemble**: Conservative upward bias when signals disagree

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
   venv\\Scripts\\activate     # On Windows
   
   # Install Python dependencies
   pip install -r requirements.txt
   pip install uvicorn python-dotenv
   ```

4. **Environment Variables**
   
   Copy the example file and fill in your actual values:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your credentials:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
   DIRECT_URL="postgresql://user:password@host:port/database"
   AUTH_SECRET="your_secret_key_here"  # Generate with: openssl rand -base64 32
   NEXT_PUBLIC_API_URL=http://localhost:8000
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   ```
   
   **⚠️ Security Note:** Never commit `.env` to git. The `.env.example` file is for reference only.

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

### ✅ Completed (v3.0.0)
- [x] Core Triage Engine with Rule-Based Logic
- [x] Python Backend Migration (FastAPI on Vercel)
- [x] Clinical Audit Trail & Logic Snapshots
- [x] Adversarial PII Scrubbing
- [x] User Authentication & Consent Gate (NextAuth v5)
- [x] Premium UI Refinement & Full-Screen Experience
- [x] Performance Tuning & Mobile Optimization
- [x] Clinical Guardrails & Protocols (Anti-Hallucination)
- [x] **Phase 1: Doctor-Like Triage System** 🆕
  - Simple language ("dizzy" not "vertigo")
  - Assessment tables (what we know vs need to check)
  - Conservative approach (asks questions before diagnosing)
- [x] **Beta Production Hardening** 🆕
  - Rate limiting (abuse prevention)
  - In-house monitoring & logging
  - Graceful error handling

### 🚧 In Progress  
- [ ] Demo feedback buttons ("Was this helpful?")
- [ ] Admin metrics dashboard
- [ ] ML Safety Layer (data collection phase)

### 🔮 Future
- [ ] Telemedicine Integration
- [ ] Multi-language Support
- [ ] Mobile Apps (iOS/Android)

---

## ⚠️ Disclaimer

**Pluto Health is in Public Beta.** This tool is for **educational and preliminary triage purposes only**. It is **NOT** a substitute for professional medical advice. Always seek the advice of qualified health providers for medical concerns.

**For emergencies, call 911 immediately.**

---

## 📚 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Rate limiting and monitoring setup
- [Beta Readiness Audit](./beta_readiness_audit.md) - Pre-launch checklist
- [ML Safety Layer Plan](./ml_safety_layer_plan.md) - Future ML integration
- [Phase 1 Walkthrough](./phase1_implementation_walkthrough.md) - Doctor-like prompts

---

## 📄 License

MIT License. Built with ❤️ for better healthcare accessibility.

**Status:** Public Beta v3.0.0 | Last Updated: January 28, 2026
