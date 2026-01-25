# Pluto Health 🏥

> **AI-Powered Clinical Triage Engine** - Professional-grade symptom analysis and clinical decision support.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🌟 Overview

Pluto Health is an intelligent clinical triage system that analyzes patient symptoms and generates professional-grade medical assessments. Built with advanced AI (Groq Llama 3.3 70B), it provides structured clinical insights including differential diagnoses, key findings, and urgency-based triage recommendations.

**Key Features:**
- 🎯 **Professional Clinical Reports** - Structured output with differential diagnosis tables, key findings, and urgency summaries
- 🗣️ **Voice Triage** - Upload symptoms via voice recording with real-time transcription (Groq Whisper)
- 📄 **Document Analysis** - Extract clinical information from medical documents and images
- 💬 **Follow-up Chat** - Interactive AI assistant for clarifying questions
- 🔒 **Secure Vault** - Encrypted local storage for personal health records
- 📊 **PDF Reports** - Generate downloadable medical assessment reports

## 🚀 Tech Stack

### Core Technologies
- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **AI Models**: 
  - Groq Llama 3.3 70B Versatile (Clinical Analysis)
  - Groq Llama 3.2 11B Vision (Document Analysis)
  - Groq Whisper Large v3 Turbo (Voice Transcription)

### Key Libraries
- **UI Components**: Radix UI, Framer Motion
- **PDF Generation**: jsPDF, jspdf-autotable
- **Authentication**: Supabase Auth
- **Security**: bcryptjs, crypto API
- **Model Context Protocol**: Custom MCP server for health vault

## 📦 Installation

### Prerequisites
- Node.js 20+ and npm
- Groq API key ([Get one here](https://console.groq.com))
- Supabase project ([Create one here](https://supabase.com))

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

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Groq AI Configuration
   GROQ_API_KEY=your_groq_api_key_here

   # Supabase Configuration (Optional - for authentication)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
pluto-landing-page/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── triage/           # Main clinical triage endpoint
│   │   ├── chat/             # Follow-up chat endpoint
│   │   ├── transcribe/       # Voice transcription endpoint
│   │   └── analyze-document/ # Document analysis endpoint
│   ├── demo/                 # Main demo/triage page
│   ├── login/                # Authentication pages
│   └── ...
├── components/               # Reusable React components
│   └── ui/                   # UI primitives (buttons, inputs, etc.)
├── lib/                      # Utility functions
│   ├── report-generator.ts   # PDF report generation
│   ├── vault.ts              # Encrypted health vault
│   └── ...
├── servers/                  # MCP Server
│   └── pluto-mcp/            # Health vault MCP integration
└── public/                   # Static assets
```

## 🎯 Core Features

### 1. Clinical Triage Engine

The heart of Pluto Health - analyzes symptoms and generates structured clinical assessments:

- **Urgency Summary**: One-sentence rationale for the assigned triage level
- **Key Clinical Findings**: Bullet-pointed observations with clinical implications
- **Differential Diagnosis**: Table-formatted list of possible conditions with likelihood ratings
- **Suggested Focus**: Areas for further clinical evaluation
- **Follow-up Questions**: Targeted questions to narrow the differential

### 2. Voice Input

Record symptoms naturally via voice:
- Real-time recording with visual feedback
- Automatic transcription using Groq Whisper Large v3 Turbo
- Seamless integration with text input

### 3. Document Analysis

Upload medical documents or images:
- Extracts clinical information from PDFs, images, and scanned documents
- Powered by Groq Llama 3.2 11B Vision Preview
- Automatically populates key findings

### 4. Health Vault

Secure, encrypted storage for personal health data:
- Client-side encryption using Web Crypto API
- Automatic checkup history tracking  
- PDF report download for each assessment
- MCP server integration for Claude Desktop

### 5. Interactive Follow-up Chat

Continue the conversation after initial assessment:
- Context-aware AI responses
- Clarifying questions for differential diagnosis
- Professional medical knowledge base

## 🔐 Security & Privacy

- **Client-Side Encryption**: All vault data is encrypted in the browser using AES-GCM
- **No Data Retention**: Symptom data is not stored server-side after analysis  
- **Anonymous Usage**: No personal information required for basic triage
- **Secure Authentication**: Optional Supabase Auth for multi-device sync

## 🧪 API Endpoints

### POST `/api/triage`
Main triage endpoint for symptom analysis.

**Request:**
```json
{
  "input": "I have a severe headache that started 2 hours ago with nausea"
}
```

**Response:**
```json
{
  "triage_level": "urgent_care",
  "urgency_summary": "Sudden severe headache with nausea warrants urgent evaluation to rule out serious neurological conditions.",
  "key_findings": [
    "Acute onset severe headache - concerning for subarachnoid hemorrhage or migraine",
    "Associated nausea - increases concern for elevated intracranial pressure"
  ],
  "differential_diagnosis": [
    {
      "condition": "Migraine with aura",
      "likelihood": "Moderate",
      "rationale": "Severe headache with nausea is classic presentation"
    },
    {
      "condition": "Subarachnoid hemorrhage",
      "likelihood": "Low",
      "rationale": "Requires urgent imaging to rule out given sudden onset"
    }
  ],
  "suggested_focus": ["Neurological examination", "Visual disturbances"],
  "follow_up_questions": ["Do you have any neck stiffness?", "Any recent head trauma?"]
}
```

### POST `/api/chat`
Follow-up chat for additional questions.

### POST `/api/transcribe`
Voice-to-text transcription endpoint.

### POST `/api/analyze-document`
Document/image analysis endpoint.

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 🌐 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/realmihir60/pluto)

## 📝 Roadmap

- [ ] Multi-language support
- [ ] Integration with EHR systems
- [ ] Telemedicine video consultation integration
- [ ] Mobile app (React Native)
- [ ] Provider dashboard for healthcare professionals
- [ ] FHIR compliance for data exchange

## ⚠️ Disclaimer

**Pluto Health is an educational and experimental prototype.** This tool is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition.

The AI-generated assessments should **NOT** be used for clinical decision-making without verification by licensed healthcare professionals.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Groq for providing fast AI inference
- Supabase for authentication infrastructure
- The Next.js team for an amazing framework
- Open-source contributors

## 📞 Contact

For questions, feedback, or collaboration:
- GitHub: [@realmihir60](https://github.com/realmihir60)
- Repository: [pluto](https://github.com/realmihir60/pluto)

---

**Built with ❤️ for better healthcare accessibility**
