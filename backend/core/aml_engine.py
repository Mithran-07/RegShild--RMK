
from datetime import datetime
import pandas as pd

class AMLEngine:
    def __init__(self):
        self.high_risk_countries = {"Panama", "Syria", "North Korea", "Iran"}
        self.structuring_threshold = 10000  # Default threshold

    def set_structuring_threshold(self, value: float):
        """Crisis Feature 1: Dynamically update reporting threshold"""
        self.structuring_threshold = value


    def calculate_weighted_risk(self, velocity: float, geo_entropy: float, hops_to_blacklist: int) -> float:
        """
        CRISIS FEATURE 2: Weighted Risk Score [0-100]
        
        Formula:
        - Velocity (tx/hr): weight 0.4
        - Geographic Entropy: weight 0.3  
        - Entity Proximity (1/hops): weight 0.3
        
        If score > 75, account is GATED to ₹5,000 limit
        """
        # Normalize velocity to 0-100 scale (assume max 10 tx/hr = 100)
        velocity_normalized = min(velocity * 10, 100)
        
        # Normalize geo_entropy (assume max distance 10000km = 100)
        geo_normalized = min((geo_entropy / 10000) * 100, 100)
        
        # Calculate proximity score (closer to blacklist = higher risk)
        if hops_to_blacklist == 0:
            proximity_score = 100
        else:
            proximity_score = (1 / hops_to_blacklist) * 100
        
        # Weighted sum
        total_risk = (
            velocity_normalized * 0.4 +
            geo_normalized * 0.3 +
            proximity_score * 0.3
        )
        
        return min(total_risk, 100)  # Cap at 100

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
        cycle_path = None  # Crisis Feature 3: Initialize cycle path safely

        
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
        
        # CRISIS FEATURE 2: Check if account is GATED
        if sender_info.get("Account_Status") == "Gated_5000_Limit":
            if amount > 5000:
                raise ValueError(f"GATED_ACCOUNT_BREACH: Account {sender_id} is limited to ₹5,000 transfers. Attempted: ${amount:,.2f}")
        
        # ---------------------------------------------------------
        # 1. Structuring Risk (Smurfing)
        # Logic: Sum amounts for Sender over trailing 24h. > threshold via multiple txs -> +30
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
                
                if total_24h > self.structuring_threshold and count_24h > 1:
                    risk_breakdown["structuring"] = 30
                    triggered_rules.append(f"Structuring: total {total_24h} > threshold {self.structuring_threshold} over {count_24h} transactions in 24h")

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
        # OPTIMIZED: Bulletproof BFS for circular detection (A->B->C->A pattern)
        # ---------------------------------------------------------
        # Build a directed graph from transaction history
        graph = {}
        if not tx_history_df.empty:
            for _, row in tx_history_df.iterrows():
                u, v = row["Sender_Account_ID"], row["Receiver_Account_ID"]
                if u not in graph:
                    graph[u] = set()
                graph[u].add(v)
        
        # Add current transaction edge to graph
        if sender_id not in graph:
            graph[sender_id] = set()
        graph[sender_id].add(receiver_id)

        # Detect CIRCULAR PATTERN: Check if receiver can reach sender in <= 2 hops
        # Pattern: A -> B -> C -> A (3 edges, forming a cycle)
        # BFS from receiver_id, looking for sender_id within 2 steps
        # CRISIS FEATURE 3: Track path for network visualization
        found_cycle = False
        cycle_path = None
        if receiver_id in graph:  # Only check if receiver has outgoing edges
            queue = [(receiver_id, 0, [sender_id, receiver_id])]  # (node, depth, path)
            visited = {receiver_id}
            
            while queue and not found_cycle:
                curr, depth, path = queue.pop(0)
                
                # Check neighbors of current node
                neighbors = graph.get(curr, set())
                for neighbor in neighbors:
                    # Found cycle: receiver leads back to sender
                    if neighbor == sender_id:
                        found_cycle = True
                        cycle_path = path + [sender_id]  # Complete the cycle
                        break
                    
                    # Continue BFS if within depth limit
                    if depth < 2 and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, depth + 1, path + [neighbor]))
            
        if found_cycle:
            risk_breakdown["network"] = 40
            triggered_rules.append("Network: Circular transaction pattern detected (A→B→C→A)")
        
        # Detect MULE ACCOUNT: Receiver has > 4 unique incoming senders
        # This indicates potential money laundering via intermediary accounts
        if not found_cycle:  # Don't double-penalize
            incoming_senders = set()
            if not tx_history_df.empty:
                receiver_history = tx_history_df[tx_history_df["Receiver_Account_ID"] == receiver_id]
                incoming_senders = set(receiver_history["Sender_Account_ID"].tolist())
            incoming_senders.add(sender_id)  # Include current sender
            
            if len(incoming_senders) > 4:
                risk_breakdown["network"] = 40
                triggered_rules.append(f"Network: Mule account detected ({len(incoming_senders)} unique senders → {receiver_id})")


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
            
        result = {
            "total_score": total_score,
            "risk_breakdown": risk_breakdown,
            "decision": decision,
            "triggered_rules": triggered_rules
        }
        
        # CRISIS FEATURE 3: Include cycle path if circular pattern detected
        if cycle_path:
            result["cycle_path"] = cycle_path
            
        return result

aml_engine = AMLEngine()
