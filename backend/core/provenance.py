
import hashlib
import sqlite3
import json
import os
from datetime import datetime
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "backend/data/provenance.db"

class ProvenanceManager:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_db()
        
        # Web3 Configuration
        self.rpc_url = os.getenv("ETH_RPC_URL", "http://127.0.0.1:7545")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract_address = os.getenv("CONTRACT_ADDRESS")
        self.private_key = os.getenv("PRIVATE_KEY")
        
        # Minimal ABI for logTransaction - Make sure this matches your Solidity contract
        # Expected: function logTransaction(string memory _hash, string memory _decision) public
        self.contract_abi = json.loads('[{"constant":false,"inputs":[{"name":"_hash","type":"string"},{"name":"_decision","type":"string"}],"name":"logTransaction","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]')
        
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS compliance_log
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      tx_id TEXT,
                      tx_data TEXT,
                      score INTEGER,
                      decision TEXT,
                      prev_hash TEXT,
                      current_hash TEXT,
                      eth_tx_hash TEXT,
                      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        conn.commit()
        conn.close()

    def get_latest_hash(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT current_hash FROM compliance_log ORDER BY id DESC LIMIT 1")
        result = c.fetchone()
        conn.close()
        return result[0] if result else "GENESIS_HASH"

    def calculate_hash(self, tx_data, score, prev_hash):
        # Deterministic string representation
        payload = f"{json.dumps(tx_data, sort_keys=True)}{score}{prev_hash}"
        return hashlib.sha256(payload.encode()).hexdigest()

    def log_transaction(self, tx_data, score, decision):
        prev_hash = self.get_latest_hash()
        current_hash = self.calculate_hash(tx_data, score, prev_hash)
        
        # Blockchain Interaction
        eth_tx_hash = "0xMockHash-GanacheDisconnnected"
        
        if self.w3.is_connected() and self.contract_address and self.private_key:
            try:
                # 1. Fetch Account
                account = self.w3.eth.account.from_key(self.private_key)
                account_addr = account.address
                
                # 2. Get Nonce
                nonce = self.w3.eth.get_transaction_count(account_addr)
                
                # 3. Build Contract Transaction
                contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
                # Ensure arguments match the ABI: logTransaction(string current_hash, string decision)
                txn_data = contract.functions.logTransaction(current_hash, decision).build_transaction({
                    'from': account_addr,
                    'nonce': nonce,
                    'gas': 2000000,
                    'gasPrice': self.w3.eth.gas_price
                })
                
                # 4. Sign Transaction
                signed_txn = self.w3.eth.account.sign_transaction(txn_data, self.private_key)
                
                # 5. Send Transaction
                tx_hash_bytes = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
                eth_tx_hash = self.w3.to_hex(tx_hash_bytes)
                print(f"Blockchain Success: TX Hash {eth_tx_hash}")

            except Exception as e:
                print(f"Blockchain Error: {e}")
                eth_tx_hash = f"0xError-{str(e)[:50]}"
        else:
             print("Blockchain Integration Skipped: Missing Credentials or Connection")
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT INTO compliance_log (tx_id, tx_data, score, decision, prev_hash, current_hash, eth_tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (tx_data.get("Transaction_ID"), json.dumps(tx_data), score, decision, prev_hash, current_hash, eth_tx_hash))
        conn.commit()
        conn.close()
        
        return {
            "prev_hash": prev_hash,
            "current_hash": current_hash,
            "eth_tx_hash": eth_tx_hash
        }

    def verify_ledger(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT tx_data, score, prev_hash, current_hash FROM compliance_log ORDER BY id ASC")
        rows = c.fetchall()
        conn.close()
        
        recalculated_prev = "GENESIS_HASH"
        for row in rows:
            tx_data_str, score, stored_prev, stored_curr = row
            tx_data = json.loads(tx_data_str)
            
            if stored_prev != recalculated_prev:
                return "TAMPERED"
            
            recalc_curr = self.calculate_hash(tx_data, score, recalculated_prev)
            
            if recalc_curr != stored_curr:
                return "TAMPERED"
            
            recalculated_prev = recalc_curr
            
        return "VERIFIED"

provenance_manager = ProvenanceManager()
