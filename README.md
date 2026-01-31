# Pluto Health

**Neuro-Symbolic Clinical Triage Engine**

Pluto Health is a clinical decision support system designed to provide preliminary triage and symptom analysis. It employs a neuro-symbolic architecture, combining deterministic clinical protocols with large language models to ensure safety, consistency, and natural interaction.

## System Architecture

The system operates as a hybrid application:
-   **Frontend**: Next.js 15 (React 19) provides the user interface.
-   **Backend**: Python FastAPI acts as the reasoning engine, deployed as serverless functions.
-   **Data Layer**: PostgreSQL (Supabase) and Prisma.
-   **Inference**: Groq Llama 3.3 70B provides natural language generation, constrained by internal protocols.

### Clinical Validation

The reasoning engine (v4.1.0) has been validated against 54 clinical scenarios, including 24 edge cases:

| Metric | Result |
| :--- | :--- |
| Stress Test Pass Rate | 87.5% |
| Emergency Detection | 100% |
| Deceptive Case Detection | 100% |
| Under-Triage Rate | 0% |

## Installation

### Prerequisites
- Node.js 20+
- Python 3.10+
- PostgreSQL
- Groq API Key

### Local Setup

1.  **Clone Repository**
    ```bash
    git clone https://github.com/realmihir60/pluto.git
    cd pluto
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    npx prisma generate
    python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
    ```

3.  **Run Development Server**
    ```bash
    # Terminal 1: Frontend
    npm run dev

    # Terminal 2: Backend
    ./run_local_backend.sh
    ```

## Deployment

The project is configured for seamless deployment on Vercel.

-   **Routing**: `vercel.json` manages API rewrites, directing specific paths to the Python backend.
-   **Serverless**: The `api/index.py` entry point handles serverless execution for the FastAPI application.
-   **Configuration**: Ensure environment variables (`GROQ_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`) are set in the Vercel dashboard.

## License

MIT License.

---
**Disclaimer**: This software is for educational purposes only and does not constitute medical advice. In an emergency, contact professional services immediately.
