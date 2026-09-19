# MedSafe AI — Medicine-Combination Risk Analysis Chatbot & RAG Engine

MedSafe AI is an assignment-ready educational prototype that analyzes potential drug-drug interaction (DDI) risks using a **deterministic backend risk engine**, **scikit-learn TF-IDF retrieval of cited package labels**, and **Gemini API for structured plain-language explanations**, built with **React, Vite, TypeScript, Tailwind CSS**, **Python FastAPI, Pydantic**, and **Supabase Postgres/Auth**.

---

## 🛡️ Core Safety Principles & Architectural Guardrails

> [!IMPORTANT]
> **Educational Prototype Only**: MedSafe AI is not a medical device. It does not provide clinical diagnoses, prescriptions, dosage adjustments, or advice to start/stop medications.

1. **Deterministic Severity Ownership**: The backend interaction engine strictly dictates all severity levels (`high`, `moderate`, `low`, `unknown`). Gemini LLM cannot alter or infer medical severity levels.
2. **Exact Unknown Result Wording**: Any pair without a curated rule returns:
   > *"No known interaction was found in this prototype dataset. This does not confirm that the combination is safe."*
3. **Structured Pydantic Validation**: LLM outputs are validated against Pydantic schemas and rejected if they attempt to change severity levels, introduce unevidenced facts, or state "safe".
4. **Alphabetical Canonical Pair Ordering**: Stores and matches ingredient pairs with `ingredient_a < ingredient_b` to ensure reliable pairwise lookup.
5. **Security & Credentials**: Gemini API keys and Supabase service secrets remain strictly on the FastAPI server and are never exposed to the browser.

---

## 🏗️ Architecture & Technology Stack

```
[ React + TS + Tailwind ] ──(HTTP JSON API)──> [ FastAPI Backend ]
                                                    │
         ┌──────────────────────────────────────────┼────────────────────────────────────────┐
         │                                          │                                        │
[ RxNorm RxNav API ]                     [ Deterministic Risk Engine ]             [ scikit-learn TF-IDF RAG ]
(Normalizes brand/generic names          (Evaluates pairwise rules;                (Indexes DailyMed label chunks;
 to RxCUIs & active ingredients)          dictates overall risk level)              retrieves cited excerpts)
                                                    │                                        │
                                                    └────────────────────┬───────────────────┘
                                                                         │
                                                             [ Gemini 2.5 Flash API ]
                                                             (Structured plain-language
                                                              8th-grade explanations)
                                                                         │
                                                             [ Supabase Postgres & Auth ]
                                                             (Audit logs, RLS policies)
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, `google-genai` SDK, `scikit-learn`, `httpx`.
- **Database/Auth**: Supabase Postgres with Row Level Security (RLS) & Supabase Auth (includes local fallback engine).
- **Deployment**: Render Web Service (FastAPI) & Render Static Site (React).

---

## 📂 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint & lifecycle events
│   │   ├── config.py                  # Pydantic environment settings
│   │   ├── api/
│   │   │   └── routes.py              # REST API endpoints
│   │   ├── services/
│   │   │   ├── rxnorm_service.py      # NIH RxNav API normalization & autocomplete
│   │   │   ├── interaction_engine.py  # Deterministic DDI engine & pair ordering
│   │   │   ├── retrieval_service.py   # TF-IDF vectorizer & cosine similarity RAG
│   │   │   ├── gemini_service.py      # Structured LLM explanations & safety guardrails
│   │   │   └── database_service.py    # Supabase client & local in-memory fallback
│   │   ├── schemas/
│   │   │   └── request_response.py    # Pydantic schemas for API inputs/outputs
│   │   └── scripts/
│   │       ├── seed_demo_data.py      # Seed clinically cited DDI benchmark rules
│   │       └── ingest_labels.py       # CLI command: python -m app.scripts.ingest_labels
│   ├── tests/                         # Pytest unit and API test suite
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/                # React UI components (MedicationInput, PairResultCard, etc.)
│   │   ├── pages/                     # AnalyzerPage, HistoryPage, LimitationsPage
│   │   ├── services/                  # Axios API & Supabase clients
│   │   ├── types/                     # TypeScript interface definitions
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # SQL schema migration with RLS policies
├── render.yaml                        # Render deployment configuration
├── .env.example
└── README.md
```

---

## 🚀 Local Setup & Development Instructions

### Prerequisites
- Python 3.10+ (Python 3.13 recommended)
- Node.js 18+ & npm
- Gemini API key (optional for LLM explanations; falls back seamlessly to deterministic engine)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run label ingestion & seed TF-IDF index
python -m app.scripts.ingest_labels

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI backend server will start at `http://localhost:8000`. Test endpoint health at `http://localhost:8000/health`.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

The React frontend web application will start at `http://localhost:3000`.

---

## 🧪 Running Automated Unit & Integration Tests

The backend test suite validates medicine normalization, canonical pair ordering (`ingredient_a < ingredient_b`), deterministic risk evaluation, exact unknown wording, TF-IDF RAG retrieval, Gemini prompt injection resilience, and FastAPI endpoints.

```bash
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # macOS/Linux

# Execute Pytest suite
pytest -v
```

---

## 🗄️ Database Setup & Supabase RLS

Execute the SQL script in `supabase/migrations/001_initial_schema.sql` inside your Supabase SQL Editor.

It creates:
- `profiles`: User account metadata
- `sources`: Package insert metadata (DailyMed / FDA)
- `source_chunks`: TF-IDF vector corpus chunks
- `ddi_rules`: Curated DDI rules with alphabetical `(ingredient_a, ingredient_b)` uniqueness constraint
- `analyses`: Query audit records
- `feedback`: User feedback ratings & comments

Row Level Security (RLS) is enabled across all tables so frontend clients can only access their own user records.

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` in the root directory:

```env
# Backend Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000
RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST

# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

---

## ☁️ Render Deployment Steps

1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository containing `render.yaml`.
5. Fill in required environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`).
6. Render will automatically provision:
   - FastAPI Backend Web Service (`/health` healthcheck path)
   - React Frontend Static Site

---

## 📋 API Reference Summary

- `GET /health` — Service health check
- `GET /api/medications/suggest?q=warf` — RxNorm medication autocomplete suggestions
- `POST /api/analyze` — Primary risk analysis endpoint
- `GET /api/analyses` — User analysis history audit log
- `GET /api/analyses/{id}` — Specific analysis details
- `POST /api/feedback` — Submit thumbs-up/down rating & comment

---

## ⚠️ Limitations & Clinical Disclaimer

- **Educational Prototype**: Designed for coursework demonstration.
- **Data Coverage**: Contains clinically reviewed seed data for core benchmark drug pairs (e.g. Warfarin + NSAIDs, Nitrates + Sildenafil, ACE Inhibitors + Potassium-sparing diuretics). Unlisted pairs return an explicit unknown status.
- **Emergency Advice**: High-risk warnings advise contacting a licensed pharmacist, prescriber, poison control (1-800-222-1222), or emergency services (911).
