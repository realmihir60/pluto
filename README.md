# Pluto Health 🏥

> **AI-Powered Clinical Triage Engine with Long-Term Memory** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-blue)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🌟 Overview

Pluto Health is an intelligent clinical triage system that analyzes patient symptoms and generates professional-grade medical assessments. Built with **Neuro-Symbolic AI** (combining Llama 3 with clinical rules), it provides structured clinical insights including differential diagnoses, key findings, and urgency-based triage recommendations.

**New in v2: Active Memory 🧠**
Pluto now remembers your medical history. It automatically extracts chronic conditions and medications from your chats and injects them into future analyses for safer, context-aware triage.

**Key Features:**
- 🎯 **Professional Clinical Reports** - Structured output with differential diagnosis tables.
- 🧠 **AI Memory & Vault** - Successfully extracts and remembers your medical profile (Allergies, Meds).
- 🗣️ **Voice Triage** - Upload symptoms via voice recording with real-time transcription.
- 📄 **Document Analysis** - Extract clinical information from images/labs.
- � **Secure Auth & Database** - Powered by Auth.js and PostgreSQL (Prisma).
- 🎨 **Glassmorphism UI** - Premium medical interface optimized for all devices.

## 🚀 Tech Stack

### Core Technologies
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Auth.js (NextAuth v5)
- **AI Models**:
  - Groq Llama 3.3 70B (Clinical Reasoning & Fact Extraction)
  - Groq Whisper V3 (Transcription)
  - Llama 3.2 Vision (Document Analysis)

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL Database (Local or Vercel Postgres)
- Groq API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/realmihir60/pluto.git
   cd pluto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file:
   ```env
   # AI
   GROQ_API_KEY=your_groq_key

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/pluto"

   # Auth
   AUTH_SECRET="your_random_secret_key" # Generate with: npx auth secret
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## �️ Architecture

### 1. The Triage Pipeline
- **Layer 1 (Edge):** Sanitizes inputs and blocks crisis keywords instantly.
- **Layer 2 (Rules):** Checks against 500+ static clinical rules.
- **Layer 3 (AI):** Llama 3.3 70B performs differential diagnosis.

### 2. The Memory System
- **Extraction:** After every chat, a background worker parses the conversation for "Medical Facts" (e.g., "User has Asthma").
- **Storage:** Facts are stored in the `MedicalFact` table linked to the User.
- **Injection:** When a new chat starts, these facts are fetched and inserted into the System Prompt.

## � Roadmap

- [x] Core Triage Engine
- [x] User Authentication
- [x] Database Persistence
- [x] Long-term AI Memory
- [ ] Telemedicine Integration
- [ ] Mobile App (React Native)

## ⚠️ Disclaimer

**Pluto Health is an educational prototype.** This tool is **NOT** a substitute for professional medical advice. Always seek the advice of qualified health providers.

## 📄 License

MIT License. Built with ❤️ for better healthcare accessibility.
