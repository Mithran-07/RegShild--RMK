"""
Live Transaction Stream Simulator
Processes transactions from the dataset and streams them via Server-Sent Events (SSE)
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
import asyncio
import pandas as pd

router = APIRouter()

async def stream_live_transactions_generator(data_loader, aml_engine, provenance_manager, generate_str_report):
    """
    Generator function that streams transactions one by one
    """
    if data_loader.transactions_df is None or data_loader.transactions_df.empty:
        yield f"data: {json.dumps({'error': 'No transactions available'})}\n\n"
        return
    
    transactions = data_loader.transactions_df.to_dict(orient="records")
    yield f"data: {json.dumps({'status': 'started', 'total': len(transactions)})}\n\n"
    
    for idx, tx_row in enumerate(transactions):
        await asyncio.sleep(1.5)  # Simulate network delay
        
        try:
            tx_dict = {
                "Transaction_ID": str(tx_row.get("Transaction_ID", f"TXN-{idx}")),
                "Sender_Account_ID": str(tx_row.get("Sender_Account_ID", "")),
                "Receiver_Account_ID": str(tx_row.get("Receiver_Account_ID", "")),
                "Amount": float(tx_row.get("Amount", 0)),
                "Timestamp": str(tx_row.get("Timestamp", "")),
                "Currency": str(tx_row.get("Currency", "USD"))
            }
            
            history_df = data_loader.transactions_df.iloc[:idx] if idx > 0 else pd.DataFrame()
            
            evaluation = aml_engine.evaluate_transaction(
                tx_dict,
                data_loader.account_lookup,
                data_loader.pep_names,
                history_df
            )
            
            score = evaluation["total_score"]
            decision = evaluation["decision"]
            triggered_rules = evaluation["triggered_rules"]
            
            provenance_record = provenance_manager.log_transaction(tx_dict, score, decision)
            
            str_text = None
            if score > 80:
                str_text = generate_str_report(tx_dict, triggered_rules)
            
            result = {
                "index": idx + 1,
                "transaction_id": tx_dict["Transaction_ID"],
                "risk_breakdown": evaluation["risk_breakdown"],
                "total_score": score,
                "decision": decision,
                "provenance": provenance_record,
                "triggered_rules": triggered_rules,
                "str_report_text": str_text,
                "transaction_details": tx_dict
            }
            
            yield f"data: {json.dumps(result)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'transaction_id': tx_row.get('Transaction_ID', 'unknown')})}\n\n"
    
    yield f"data: {json.dumps({'status': 'completed'})}\n\n"
