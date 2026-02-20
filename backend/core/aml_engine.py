
from datetime import datetime
import pandas as pd

class AMLEngine:
    def __init__(self):
        self.high_risk_countries = {"Panama", "Syria", "North Korea", "Iran"}

    def evaluate_transaction(self, tx, account_db, pep_db, tx_history_df):
        """
        Evaluates a single transaction against 6 deterministic rules.
        
        Args:
            tx (dict): The transaction to evaluate. Must contain:
                       'Sender_Account_ID', 'Receiver_Account_ID', 'Amount', 'Timestamp'
            account_db (dict): Account lookup dictionary.
            pep_db (set): Set of PEP names.
            tx_history_df (pd.DataFrame): DataFrame of past transactions.
            
        Returns:
            dict: Evaluation result containing total_score, risk_breakdown, and decision.
        """
        
        risk_breakdown = {
            "structuring": 0,
            "velocity": 0,
            "network": 0,
            "pep": 0,
            "jurisdiction": 0,
            "kyc": 0
        }
        triggered_rules = []
        
        sender_id = tx.get("Sender_Account_ID")
        receiver_id = tx.get("Receiver_Account_ID")
        amount = float(tx.get("Amount", 0))
        timestamp_str = tx.get("Timestamp")
        
        try:
            current_time = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        except:
            current_time = datetime.now() # Fallback

        sender_info = account_db.get(sender_id, {})
        receiver_info = account_db.get(receiver_id, {})
        
        # ---------------------------------------------------------
        # 1. Structuring Risk (Smurfing)
        # Logic: Sum amounts for Sender over trailing 24h. > $10k via multiple txs -> +30
        # ---------------------------------------------------------
        if not tx_history_df.empty:
            # Filter for sender
            sender_history = tx_history_df[tx_history_df["Sender_Account_ID"] == sender_id].copy()
            if not sender_history.empty:
                # Convert timestamps safely
                sender_history["Timestamp_dt"] = pd.to_datetime(sender_history["Timestamp"])
                start_window = current_time - pd.Timedelta(hours=24)
                
                recent_txs = sender_history[sender_history["Timestamp_dt"] >= start_window]
                total_24h = recent_txs["Amount"].sum() + amount
                count_24h = len(recent_txs) + 1
                
                if total_24h > 10000 and count_24h > 1:
                    risk_breakdown["structuring"] = 30
                    triggered_rules.append(f"Structuring: total {total_24h} over {count_24h} transactions in 24h")

        # ---------------------------------------------------------
        # 2. Velocity Risk
        # Logic: Count frequency in last 48h. If > 3x baseline (assume 5 for MVP) -> +20
        # ---------------------------------------------------------
        if not tx_history_df.empty:
            start_window_48 = current_time - pd.Timedelta(hours=48)
            # Re-using sender_history if computed, else re-filter
            # (Assuming simplicity here)
            sender_history_48 = tx_history_df[
                (tx_history_df["Sender_Account_ID"] == sender_id)
            ].copy()
            sender_history_48["Timestamp_dt"] = pd.to_datetime(sender_history_48["Timestamp"])
            recent_48h = sender_history_48[sender_history_48["Timestamp_dt"] >= start_window_48]
            
            # Simple threshold for MVP: > 5 tx in 48h is suspicious if no baseline
            if len(recent_48h) > 5:
                risk_breakdown["velocity"] = 20
                triggered_rules.append(f"Velocity: {len(recent_48h)} transactions in 48h")

        # ---------------------------------------------------------
        # 3. Network & Layering Risk (Graph Traversal)
        # Logic: 3 hops. Circular (A->B->C->A) or Mule (Many->One). +40 Risk.
        # ---------------------------------------------------------
        # Build a mini graph from history
        # (This is expensive for large history, but okay for MVP/Hackathon)
        graph = {}
        if not tx_history_df.empty:
             for _, row in tx_history_df.iterrows():
                u, v = row["Sender_Account_ID"], row["Receiver_Account_ID"]
                if u not in graph: graph[u] = set()
                graph[u].add(v)
        
        # Add current edge
        if sender_id not in graph: graph[sender_id] = set()
        graph[sender_id].add(receiver_id)

        # Detect cycle: Start at receiver, see if we can reach sender in < 3 steps
        # Path: receiver -> x -> sender (length 2, total 3 edges A->R->x->A)
        # BFS
        found_cycle = False
        queue = [(receiver_id, 0)]
        visited = set([receiver_id])
        
        while queue:
            curr, depth = queue.pop(0)
            if depth >= 2: continue
            
            neighbors = graph.get(curr, [])
            for neighbor in neighbors:
                if neighbor == sender_id:
                    found_cycle = True
                    break
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth+1))
            if found_cycle: break
            
        if found_cycle:
             risk_breakdown["network"] = 40
             triggered_rules.append("Network: Circular transaction detected")
        
        # Detect Mule: Receiver has > X diverse incoming senders
        # Logic: Check indegree of receiver
        receivers_senders = set()
        if not tx_history_df.empty:
             rec_history = tx_history_df[tx_history_df["Receiver_Account_ID"] == receiver_id]
             receivers_senders = set(rec_history["Sender_Account_ID"].tolist())
        receivers_senders.add(sender_id)
        
        if len(receivers_senders) > 4: # Arbitrary "Mule" threshold
             if risk_breakdown["network"] == 0: # Avoid double penalty or stack?
                 risk_breakdown["network"] = 40
                 triggered_rules.append(f"Network: Potential Mule (Received from {len(receivers_senders)} unique senders)")


        # ---------------------------------------------------------
        # 4. PEP Risk
        # Logic: Sender or Receiver name in PEP list. +50.
        # ---------------------------------------------------------
        sender_name = sender_info.get("Name", "")
        receiver_name = receiver_info.get("Name", "")
        
        is_sender_pep = sender_name.lower() in pep_db
        is_receiver_pep = receiver_name.lower() in pep_db
        
        if is_sender_pep or is_receiver_pep:
            risk_breakdown["pep"] = 50
            triggered_rules.append(f"PEP: Match found ({'Sender' if is_sender_pep else 'Receiver'})")
            
            # High Value PEP Escalation (> $20k)
            if amount > 20000:
                risk_breakdown["pep"] += 35  # Pushes score > 80 (STR Generation)
                triggered_rules.append("PEP: High-Value Transaction Escalation (> $20k)")

        # ---------------------------------------------------------
        # 5. Jurisdiction Risk
        # Logic: Country in High-Risk list. +25.
        # ---------------------------------------------------------
        # Check Sender and Receiver countries
        # The prompt specifically says "Check the Country field."
        # Assuming sender's country for now, or both. Let's check both?
        # Prompt says "If *it* matches...". Usually sender country or destination country. I'll check both.
        
        sender_country = sender_info.get("Country", "Unknown")
        receiver_country = receiver_info.get("Country", "Unknown")
        
        if sender_country in self.high_risk_countries or receiver_country in self.high_risk_countries:
            risk_breakdown["jurisdiction"] = 25
            triggered_rules.append(f"Jurisdiction: High Risk ({sender_country if sender_country in self.high_risk_countries else receiver_country})")

        # ---------------------------------------------------------
        # 6. KYC & Profile Risk
        # Logic: KYC "Incomplete" OR Amount > 50% Declared_Income. +20.
        # ---------------------------------------------------------
        kyc_status = sender_info.get("KYC_Status", "Incomplete")
        declared_income = float(sender_info.get("Declared_Income", 0))
        
        kyc_risk = False
        if kyc_status == "Incomplete":
            kyc_risk = True
            triggered_rules.append("KYC: Status is Incomplete")
        
        if declared_income > 0 and amount > (0.5 * declared_income):
            kyc_risk = True
            triggered_rules.append(f"KYC: Amount ({amount}) > 50% of Income ({declared_income})")
            
        if kyc_risk:
            risk_breakdown["kyc"] = 20

        # Total Scoring
        total_score = sum(risk_breakdown.values())
        
        decision = "Clear"
        if total_score > 80:
            decision = "Generate STR"
        elif total_score >= 50:
            decision = "Flag for Review"
            
        return {
            "total_score": total_score,
            "risk_breakdown": risk_breakdown,
            "decision": decision,
            "triggered_rules": triggered_rules
        }

aml_engine = AMLEngine()
