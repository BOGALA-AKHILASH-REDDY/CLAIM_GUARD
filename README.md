# 🛡️ ClaimGuard — AI-Powered Health Insurance Claim Denial Prevention & Policy Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-8.2.1-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![Machine Learning](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg?style=flat&logo=scikitlearn)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ClaimGuard** is an end-to-end intelligent health insurance claims processing, pre-submission denial prevention, policy lifecycle management, and provider/policyholder intelligence portal.

---

## 🌟 Key Features

### 1. 🔍 16-Factor Pre-Submission Claim Validation Engine
- Evaluates claims against 16 comprehensive criteria before submission (coverage active status, waiting periods, room rent sub-limits, disease caps, pre-authorization, itemized billing, document authenticity, etc.).
- Real-time scoring matrix with weighted confidence score (0–100%) and instant risk categorization (**Low**, **Medium**, **High**).
- Automated AI recommendations with step-by-step resolution paths for high-risk flags.

### 2. 🤖 AI & Machine Learning Claim Risk Predictor
- Pre-trained ML model (`RandomForest` / `GradientBoosting` classifier pipeline) assessing denial probability based on historical claim patterns, diagnosis, procedure, billing anomalies, and policy terms.
- Feature importance visualization and denial risk scorecards.

### 3. 📄 Automated Document Processing & Certified Audit Reports
- Multi-format document upload (PDF, PNG, JPG) with verification status tracking.
- Instant ReportLab-powered PDF generation of official **Claim Audit Reports** with cryptographic verification hashes, before/after score comparisons, and factor breakdowns.

### 4. 🏥 Policy Lifecycle & Continuation Services
- **Pre-Claim Eligibility Check**: Instant verification of policy active status, remaining sum insured, covered treatments, exclusions, and premium dues.
- **Out-of-Pocket Payout Estimator**: Simulate hospital bills, room types, deductibles, and co-pay to calculate estimated insurance payout vs. patient out-of-pocket expenses before admission.
- **Policy Management**: Endorsement, transfer, surrender calculations, arrears management, policy renewal tracking, and benefit migration.

### 5. 📊 Real-Time Executive Dashboard & Analytics
- Overview of total claims, approval rates, average confidence scores, active policies, and recent audit logs.
- Interactive charts, claims status timeline, member directory, and payment tracking.

---

## 🏗️ Architecture & Tech Stack

```
COGNIZANT_PROJECT/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI REST endpoints (claims, policies, services, payments, auth, etc.)
│   │   ├── database/     # SQLAlchemy sessions, database seeders, dataset sync
│   │   ├── ml/           # Claim denial predictor & ML model training scripts
│   │   ├── models/       # Database ORM models
│   │   ├── schemas/      # Pydantic data validation models
│   │   ├── utils/        # PDF Report generator, security, JWT helpers
│   │   └── validators/   # 16-Factor claim validation rules engine
│   ├── data/             # Historical training datasets & policyholder records
│   ├── tests/            # Automated pytest test suites
│   ├── requirements.txt  # Python package dependencies
│   └── .env.example      # Environment configuration template
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI widgets (ConfidenceGauge, FactorBadge, MetricCard, Sidebar, Navbar, etc.)
│   │   ├── context/      # React Authentication & User context
│   │   ├── pages/        # Dashboard, Claims, Policyholder, Documents, Recommendations, Services, etc.
│   │   ├── services/     # Axios API service client
│   │   └── utils/        # Formatters & helper utilities
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite build & proxy configuration
│
└── claimguard.db         # SQLite database file
```

### Technologies Used:
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Uvicorn, Pydantic v2, Scikit-learn, ReportLab, PyPDF, Joblib
- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons, Chart.js / Recharts, Axios
- **Database**: SQLite (default zero-config) / MySQL compatible
- **Security**: JWT Bearer Authentication, bcrypt password hashing, CORS middleware

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env   # Windows
cp .env.example .env     # Linux/macOS

# Run database seed (initializes sample policyholders, policies, and claims)
python -m app.database.seed_data

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> **API Documentation**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for Swagger UI or [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) for ReDoc.

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

> **Web Application**: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Running Automated Tests

```bash
# From workspace root
python -m pytest backend/tests/ -v -W ignore
```

---

## 🔑 Demo Credentials

| Role | Username / ID | Password | Access Level |
|---|---|---|---|
| **Hospital / Provider** | `provider@claimguard.com` | `Provider@123` | Full Claim Submission, Scoring, Pre-Auth, Audit Reports |
| **Policyholder** | `POL-1001` | *(from dataset)* | Member Portal, Policy Coverage, Pre-Claim Eligibility |

---

## 📑 Core API Highlights

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | JWT Authentication for Providers & Policyholders |
| `GET` | `/api/dashboard/stats` | High-level metrics, active claim volumes & risk breakdown |
| `POST` | `/api/claims` | Submit new claim & run 16-factor validation scorecard |
| `GET` | `/api/claims/{claim_id}` | Fetch full claim details, risk score & factor audit logs |
| `POST` | `/api/claims/{claim_id}/documents` | Upload & verify claim-related medical bills and summaries |
| `GET` | `/api/claims/{claim_id}/report` | Download certified PDF Claim Audit Report |
| `GET` | `/api/policy-services/continuation/eligibility-check` | Pre-claim coverage & eligibility check |
| `POST` | `/api/policy-services/continuation/estimate-claim` | Out-of-pocket payout simulation engine |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
