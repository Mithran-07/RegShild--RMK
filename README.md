# RegShield: Real-Time AML & Compliance Engine

RegShield is a cutting-edge Anti-Money Laundering (AML) and compliance platform designed to detect suspicious financial activities in real-time. It leverages deterministic rule-based engines for immediate flagging, Generative AI (Llama-3.3-70b via Groq) for automated Suspicious Transaction Report (STR) drafting, and blockchain anchoring for immutable audit trails.

## 🚀 Features

*   **Real-Time Transaction Monitoring:** Evaluates high-velocity transactions, structuring (smurfing) attempts, and PEP (Politically Exposed Persons) interactions.
*   **AI-Powered Reporting:** Automatically generates formal Suspicious Transaction Reports (STRs) using advanced LLMs when risk scores exceed critical thresholds.
*   **Immutable Ledger:** Anchors all compliance decisions to a local blockchain (Ganache) to ensure data integrity and prevent tampering.
*   **Interactive Dashboard:** A Next.js-based frontend providing visual risk breakdowns, radar charts, and instant decision badges (Clear, Review, STR).
*   **Digital Fingerprinting:** PDF reports are secured with SHA-256 cryptographic hashes for verification.

## 🛠 Tech Stack

### Backend
*   **Framework:** FastAPI (Python 3.14)
*   **Data Processing:** Pandas, NumPy
*   **Database:** SQLite (for local provenance)
*   **Blockchain:** Web3.py, Ganache (Ethereum Testnet)
*   **AI/LLM:** Groq API (Llama-3.3-70b-versatile)

### Frontend
*   **Framework:** Next.js 16 (App Router)
*   **Styling:** Tailwind CSS
*   **Visualization:** Recharts
*   **Report Generation:** jsPDF

## 📂 Project Structure

```
RegShield/
├── backend/
│   ├── core/
│   │   ├── aml_engine.py       # Deterministic rule logic
│   │   ├── ingestion.py        # Data loading (Mock Excel/DB)
│   │   └── provenance.py       # Blockchain anchoring logic
│   ├── data/                   # Excel data sources and SQLite DB
│   ├── services/
│   │   └── str_generator.py    # LLM integration for STRs
│   └── main.py                 # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   └── components/         # React components (RiskDashboard)
│   └── package.json
├── .env                        # Configuration (API Keys, RPC URLs)
└── requirements.txt            # Python dependencies
```

## ⚡ Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+ and npm
*   Ganache (for local blockchain simulation)
*   Groq API Key

### 1. Backend Setup

1.  Navigate to the project root:
    ```bash
    cd RegShield
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    Create a `.env` file in `RegShield/` with the following:
    ```env
    ETH_RPC_URL=http://127.0.0.1:7545
    CONTRACT_ADDRESS=0xYourGanacheContractAddress
    PRIVATE_KEY=0xYourGanachePrivateKey
    LLM_PROVIDER=groq
    LLM_API_KEY=your_groq_api_key
    LLM_MODEL=llama-3.3-70b-versatile
    ```
5.  Run the server:
    ```bash
    uvicorn backend.main:app --reload
    ```
    The backend will run at `http://localhost:8000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## 🛡 Usage

1.  Open the frontend dashboard.
2.  Enter a Transaction ID (e.g., from `backend/data/regshield_transaction_log.xlsx`).
3.  Click **"Analyze Transaction"**.
4.  Review the Risk Score, Triggered Rules, and AI Analysis.
5.  If High Risk (>80), download the **SHA-256 Signed PDF Report**.

## 📄 License
This project is for educational and hackathon purposes.
