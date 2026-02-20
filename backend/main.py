
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import pandas as pd
import json

from backend.core.ingestion import DataLoader
from backend.core.aml_engine import AMLEngine
from backend.core.provenance import ProvenanceManager
from backend.services.str_generator import generate_str_report
from backend.services.simulator import stream_live_transactions_generator
from fastapi.responses import StreamingResponse

app = FastAPI(title="RegShield: Real-Time AML & Compliance Rule Engine")

# Add CORS Middleware for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Logic Layers
# In a real app, use dependency injection or lifespan events
data_loader = DataLoader(data_dir="backend/data")
aml_engine = AMLEngine()
provenance_manager = ProvenanceManager(db_path="backend/data/provenance.db")

class Transaction(BaseModel):
    Transaction_ID: str
    Sender_Account_ID: str
    Receiver_Account_ID: str
    Amount: float
    Timestamp: str
    Currency: Optional[str] = "USD"
    
class TransactionResponse(BaseModel):
    transaction_id: str
    risk_breakdown: Dict[str, int]
    total_score: int
    decision: str
    provenance: Dict[str, str]
    triggered_rules: List[str]
    str_report_url: Optional[str] = None
    str_report_text: Optional[str] = None # For display in frontend

@app.on_event("startup")
def startup_event():
    # Load data on startup
    data_loader.load_data()
    print("RegShield System Initialized: Data Loaded.")

@app.post("/api/evaluate", response_model=TransactionResponse)
def evaluate_transaction(tx: Transaction):
    tx_dict = tx.dict()
    
    # 1. Get Context (Account Info, PEP status, History)
    history_df = data_loader.transactions_df
    account_db = data_loader.account_lookup
    pep_db = data_loader.pep_names
    
    # 2. Run Deterministic Rules
    evaluation = aml_engine.evaluate_transaction(
        tx_dict, 
        account_db, 
        pep_db, 
        history_df
    )
    
    score = evaluation["total_score"]
    decision = evaluation["decision"]
    triggered_rules = evaluation["triggered_rules"]
    
    # 3. Anchor to Blockchain (Provenance)
    provenance_record = provenance_manager.log_transaction(
        tx_dict, 
        score, 
        decision
    )
    
    # 4. Generate STR if needed
    str_text = None
    str_url = None
    
    if score > 80:
        str_text = generate_str_report(tx_dict, triggered_rules)
        str_url = f"/api/reports/{tx.Transaction_ID}.pdf"
        
    # 5. Update Memory State (Simulate Real-Time Ingestion)
    # convert tx_dict to dataframe row and append
    new_row = pd.DataFrame([tx_dict])
    data_loader.transactions_df = pd.concat([data_loader.transactions_df, new_row], ignore_index=True)
    
    return {
        "transaction_id": tx.Transaction_ID,
        "risk_breakdown": evaluation["risk_breakdown"],
        "total_score": score,
        "decision": decision,
        "provenance": provenance_record,
        "triggered_rules": triggered_rules,
        "str_report_url": str_url,
        "str_report_text": str_text
    }

@app.get("/api/verify_ledger")
def verify_ledger():
    status = provenance_manager.verify_ledger()
    if status == "TAMPERED":
        raise HTTPException(status_code=409, detail="Blockchain Integrity Check Failed: TAMPERED")
    return {"status": "VERIFIED", "message": "All transactions match the cryptographic chain."}

@app.get("/")
def read_root():
    return {"message": "RegShield AML Engine is Running. Use /docs for API."}

@app.get("/api/stream/live")
async def stream_transactions():
    """
    Server-Sent Events endpoint for live transaction monitoring simulation.
    """
    return StreamingResponse(
        stream_live_transactions_generator(
            data_loader, 
            aml_engine, 
            provenance_manager,
            generate_str_report
        ),
        media_type="text/event-stream"
    )
