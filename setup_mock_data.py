
import pandas as pd
import os

# Create data directory if it doesn't exist
os.makedirs("backend/data", exist_ok=True)

# 1. Accounts
accounts_data = {
    "Account_ID": ["ACC-001", "ACC-002", "ACC-003", "ACC-004", "ACC-005"],
    "Name": ["John Doe", "Jane Smith", "Global Corp", "Panama Holdings", "Syria Imports"],
    "KYC_Status": ["Verified", "Incomplete", "Verified", "Verified", "Verified"],
    "Declared_Income": [50000, 30000, 1000000, 200000, 150000],
    "Country": ["USA", "USA", "UK", "Panama", "Syria"]
}
df_accounts = pd.DataFrame(accounts_data)
df_accounts.to_excel("backend/data/regshield_account_master.xlsx", index=False)
print("Created regshield_account_master.xlsx")

# 2. PEP Watchlist
pep_data = {
    "Name": ["Politician A", "General B", "High Risk Official", "Panama Holdings"],
    "Role": ["Minister", "General", "Ambassador", "Shell Company"],
    "Country": ["Country X", "Country Y", "Country Z", "Panama"]
}
df_pep = pd.DataFrame(pep_data)
df_pep.to_excel("backend/data/regshield_pep_watchlist.xlsx", index=False)
print("Created regshield_pep_watchlist.xlsx")

# 3. Transactions (Historical / Mock)
transactions_data = {
    "Transaction_ID": ["TXN-001", "TXN-002"],
    "Sender_Account_ID": ["ACC-001", "ACC-002"],
    "Receiver_Account_ID": ["ACC-003", "ACC-001"], 
    "Amount": [500, 10000],
    "Timestamp": ["2023-10-26 10:00:00", "2023-10-26 12:00:00"]
}
df_tx = pd.DataFrame(transactions_data)
df_tx.to_excel("backend/data/regshield_transaction_log.xlsx", index=False)
print("Created regshield_transaction_log.xlsx")
