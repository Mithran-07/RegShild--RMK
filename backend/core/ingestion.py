
import pandas as pd
import os

class DataLoader:
    def __init__(self, data_dir="backend/data"):
        self.data_dir = data_dir
        self.accounts_df = None
        self.pep_df = None
        self.transactions_df = None
        self.pep_names = set()
        self.account_lookup = {}
        
        self.load_data()

    def load_data(self):
        # 1. Load Accounts (Use specific names from Prompt)
        accounts_path = os.path.join(self.data_dir, "regshield_account_master.xlsx")
        if os.path.exists(accounts_path):
            self.accounts_df = pd.read_excel(accounts_path)
            # Create O(1) Lookup
            self.account_lookup = self.accounts_df.set_index("Account_ID").to_dict(orient="index")
        
        # 2. Load PEP Watchlist
        pep_path = os.path.join(self.data_dir, "regshield_pep_watchlist.xlsx")
        if os.path.exists(pep_path):
            self.pep_df = pd.read_excel(pep_path)
            self.pep_names = set(self.pep_df["Name"].str.lower().tolist())

        # 3. Load Transactions (Simulated Stream)
        tx_path = os.path.join(self.data_dir, "regshield_transaction_log.xlsx")
        if os.path.exists(tx_path):
            self.transactions_df = pd.read_excel(tx_path)

    def get_account(self, account_id):
        return self.account_lookup.get(account_id)

    def is_pep(self, name):
        if not name:
            return False
        return name.lower() in self.pep_names

    def get_all_transactions(self):
        if self.transactions_df is not None:
            return self.transactions_df.to_dict(orient="records")
        return []

# Initialize global loader
data_loader = DataLoader() # This will run on import, which isn't ideal for modularity but fits the prompt's simplicity. 
# Better to instantiate where needed or use Dependency Injection. 
# For now, I'll instantiate it inside the main app or keep it here as a singleton.
