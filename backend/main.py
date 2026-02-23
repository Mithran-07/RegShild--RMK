
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import pandas as pd
import json
import sqlite3

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

# In-memory STR report storage (use Redis/DB in production)
str_reports_cache = {}

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
    str_report_text: Optional[str] = None
    cycle_path: Optional[List[str]] = None  # CRISIS FEATURE 3

@app.on_event("startup")
def startup_event():
    # Load data on startup
    data_loader.load_data()
    print("RegShield System Initialized: Data Loaded.")

@app.post("/api/evaluate", response_model=TransactionResponse)
def evaluate_transaction(tx: Transaction, background_tasks: BackgroundTasks):
    """
    OPTIMIZED: Returns risk score in < 200ms (sub-second).
    STR generation runs in background to meet < 2 second dashboard refresh requirement.
    """
    tx_dict = tx.dict()
    
    # 1. Get Context (Account Info, PEP status, History)
    history_df = data_loader.transactions_df
    account_db = data_loader.account_lookup
    pep_db = data_loader.pep_names
    
    # 2. Run Deterministic Rules (FAST - no LLM here)
    try:
        evaluation = aml_engine.evaluate_transaction(
            tx_dict, 
            account_db, 
            pep_db, 
            history_df
        )
    except ValueError as e:
        if "GATED_ACCOUNT_BREACH" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        raise
    
    score = evaluation["total_score"]
    decision = evaluation["decision"]
    triggered_rules = evaluation["triggered_rules"]
    
    # 3. Anchor to Blockchain (Provenance) - Uses mock hash if not connected, still fast
    provenance_record = provenance_manager.log_transaction(
        tx_dict, 
        score, 
        decision
    )
    
    # 4. Schedule STR generation in background if score > 80
    # This ensures the API returns immediately without waiting for LLM
    str_url = None
    if score > 80:
        str_url = f"/api/reports/{tx.Transaction_ID}.pdf"
        # Queue background task to generate STR asynchronously
        background_tasks.add_task(
            generate_str_report_async,
            tx_dict,
            triggered_rules,
            tx.Transaction_ID
        )
        
    # 5. Update Memory State (Simulate Real-Time Ingestion)
    new_row = pd.DataFrame([tx_dict])
    data_loader.transactions_df = pd.concat([data_loader.transactions_df, new_row], ignore_index=True)
    
    # RETURN IMMEDIATELY - No waiting for LLM
    return {
        "transaction_id": tx.Transaction_ID,
        "risk_breakdown": evaluation["risk_breakdown"],
        "total_score": score,
        "decision": decision,
        "provenance": provenance_record,
        "triggered_rules": triggered_rules,
        "str_report_url": str_url,
        "str_report_text": "STR report generating in background..." if score > 80 else None,
        "cycle_path": evaluation.get("cycle_path")  # CRISIS FEATURE 3
    }

def generate_str_report_async(tx_dict: dict, triggered_rules: list, tx_id: str):
    """
    Background task to generate STR report without blocking the API response.
    Stores report in memory cache for later retrieval.
    """
    try:
        str_text = generate_str_report(tx_dict, triggered_rules)
        # Store in cache for retrieval
        str_reports_cache[tx_id] = str_text
        print(f"✅ STR Report generated and cached for {tx_id}")
    except Exception as e:
        print(f"❌ STR Generation failed for {tx_id}: {e}")
        # Store error report as fallback
        str_reports_cache[tx_id] = f"Error generating report: {str(e)}"

@app.get("/api/reports/{transaction_id}")
def get_str_report(transaction_id: str):
    """
    Retrieve STR report for a specific transaction.
    Returns the report text if available, or 404 if not found.
    """
    if transaction_id in str_reports_cache:
        return {"transaction_id": transaction_id, "report": str_reports_cache[transaction_id]}
    else:
        raise HTTPException(status_code=404, detail=f"STR report for {transaction_id} not found. It may still be generating.")

@app.get("/api/verify_ledger")
def verify_ledger():
    status = provenance_manager.verify_ledger()
    if status == "TAMPERED":
        raise HTTPException(status_code=409, detail="Blockchain Integrity Check Failed: TAMPERED")
    return {"status": "VERIFIED", "message": "All transactions match the cryptographic chain."}

@app.post("/api/simulate_tamper")
def simulate_tamper():
    """
    CRISIS SCENARIO: Insider Threat Simulation
    Randomly selects a historical transaction and alters its Amount/Score WITHOUT updating the hash.
    This guarantees a 100% Tampering Detection Rate when /api/verify_ledger is called.
    """
    import random
    
    conn = sqlite3.connect(provenance_manager.db_path)
    c = conn.cursor()
    
    # Get all transactions
    c.execute("SELECT id, tx_id, score, tx_data FROM compliance_log WHERE id > 1 ORDER BY id DESC LIMIT 10")
    rows = c.fetchall()
    
    if not rows:
        conn.close()
        raise HTTPException(status_code=404, detail="No transactions available to tamper")
    
    # Pick a random transaction (not the first/genesis one)
    target = random.choice(rows)
    target_id, tx_id, original_score, tx_data_str = target
    
    # Tamper: Change the score without recalculating hash
    tampered_score = original_score + random.randint(10, 50)
    
    # Also tamper the tx_data amount for more chaos
    tx_data = json.loads(tx_data_str)
    original_amount = tx_data.get("Amount", 0)
    tx_data["Amount"] = original_amount * 1.5  # Inflate by 50%
    tampered_tx_data = json.dumps(tx_data)
    
    # Update DB WITHOUT changing hash (THIS IS THE ATTACK)
    c.execute("UPDATE compliance_log SET score = ?, tx_data = ? WHERE id = ?",
              (tampered_score, tampered_tx_data, target_id))
    conn.commit()
    conn.close()
    
    return {
        "status": "TAMPERED",
        "message": "🚨 INSIDER ATTACK SIMULATED 🚨",
        "details": {
            "transaction_id": tx_id,
            "original_score": original_score,
            "tampered_score": tampered_score,
            "original_amount": original_amount,
            "tampered_amount": tx_data["Amount"]
        },
        "warning": "Call /api/verify_ledger to detect this tampering"
    }

@app.post("/api/admin/shift_threshold")
def shift_threshold(new_threshold: float = 7000):
    """
    CRISIS FEATURE 1: Adaptive Regulatory Threshold Shift
    Retroactively scans last 24h transactions and flags accounts that now exceed the new threshold.
    Also updates the live compliance engine for future transactions.
    """
    # Dynamic Update for Future Transactions
    aml_engine.set_structuring_threshold(new_threshold)

    from datetime import datetime, timedelta
    
    current_time = datetime.now()
    lookback_time = current_time - timedelta(hours=24)
    
    if data_loader.transactions_df.empty:
        return {"newly_flagged_accounts": [], "message": "No transactions in history"}
    
    df = data_loader.transactions_df.copy()
    df["Timestamp_dt"] = pd.to_datetime(df["Timestamp"], errors='coerce')
    recent_txs = df[df["Timestamp_dt"] >= lookback_time]
    
    if recent_txs.empty:
        return {"newly_flagged_accounts": [], "message": "No transactions in last 24 hours"}
    
    sender_sums = recent_txs.groupby("Sender_Account_ID")["Amount"].sum()
    old_threshold = 10000
    newly_flagged = []
    
    for sender_id, total_amount in sender_sums.items():
        if new_threshold < total_amount <= old_threshold:
            account_info = data_loader.account_lookup.get(sender_id, {})
            
            str_report = f"""
RETROACTIVE SUSPICIOUS TRANSACTION REPORT (STR)
Generated: {datetime.now().isoformat()}

Account: {sender_id}
Name: {account_info.get('Name', 'Unknown')}
24-Hour Total: ${total_amount:,.2f}

REASON: Regulatory threshold reduced from ${old_threshold:,.2f} to ${new_threshold:,.2f}
Account total now exceeds new structuring threshold.

RECOMMENDATION: Enhanced Due Diligence (EDD) required
"""
            
            newly_flagged.append({
                "account_id": sender_id,
                "name": account_info.get("Name", "Unknown"),
                "24h_total": float(total_amount),
                "old_threshold": old_threshold,
                "new_threshold": new_threshold,
                "str_report": str_report
            })
    
    return {
        "status": "THRESHOLD_SHIFT_COMPLETE",
        "new_threshold": new_threshold,
        "old_threshold": old_threshold,
        "newly_flagged_accounts": newly_flagged,
        "count": len(newly_flagged),
        "message": f"Retroactive scan complete. {len(newly_flagged)} accounts now flagged."
    }

@app.post("/api/admin/apply_weighted_risk")
def apply_weighted_risk(account_id: str, velocity: float, geo_entropy: float, hops_to_blacklist: int):
    """
    CRISIS FEATURE 2: Apply weighted risk scoring and gate high-risk accounts
    """
    risk_score = aml_engine.calculate_weighted_risk(velocity, geo_entropy, hops_to_blacklist)
    
    account_info = data_loader.account_lookup.get(account_id)
    if not account_info:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")
    
    # If risk > 75, GATE the account
    if risk_score > 75:
        data_loader.account_lookup[account_id]["Account_Status"] = "Gated_5000_Limit"
        status = "GATED"
        message = f"⚠️ ACCOUNT GATED: Risk score {risk_score:.2f} exceeds threshold (75). Transfer limit: ₹5,000"
    else:
        status = "APPROVED"
        message = f"✓ Account approved. Risk score: {risk_score:.2f}"
    
    return {
        "account_id": account_id,
        "risk_score": risk_score,
        "status": status,
        "message": message,
        "components": {
            "velocity": velocity,
            "geo_entropy": geo_entropy,
            "hops_to_blacklist": hops_to_blacklist
        }
    }

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
