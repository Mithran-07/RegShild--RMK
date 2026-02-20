# 🔐 Blockchain Integration Setup

## Overview
RegShield uses Ganache (local Ethereum blockchain) to create an immutable audit trail for compliance decisions.

## Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
pip install py-solc-x
```

### Step 2: Start Ganache
1. Download Ganache: https://trufflesuite.com/ganache/
2. Open Ganache and create a new workspace
3. Verify it's running on port **7545**

### Step 3: Deploy Smart Contract
```bash
cd /Users/mithran/Documents/RMK/RegShield/blockchain
python3 deploy_contract.py
```

### Step 4: Update .env File
The deployment script will output something like:
```
ETH_RPC_URL=http://127.0.0.1:7545
ETH_CONTRACT_ADDRESS=0xAbC123...
ETH_SENDER_ADDRESS=0xDeF456...
ETH_PRIVATE_KEY=<GET_FROM_GANACHE_UI>
```

**Get the Private Key:**
1. Open Ganache
2. Find the account matching `ETH_SENDER_ADDRESS`
3. Click the 🔑 key icon next to it
4. Copy the private key
5. Add all values to `RegShield/.env`

### Step 5: Restart Backend
```bash
# Stop the current backend (Ctrl+C)
cd /Users/mithran/Documents/RMK/RegShield
PYTHONPATH=/Users/mithran/Documents/RMK/RegShield python3 -m uvicorn backend.main:app --reload
```

## Verification

After setup, you should see:
```
✅ Web3 Connected to Ganache at http://127.0.0.1:7545
```

When you submit a transaction, you'll see:
```
✅ Blockchain TX: 0x1a2b3c... (Block: 5)
```

## Troubleshooting

**"GanacheDisconnected"**
- Make sure Ganache is running
- Check port 7545 is not blocked

**"MissingConfig"**
- Verify all ENV variables are set in `.env`
- Restart the backend after updating `.env`

**"Error-revert"**
- Contract might not be deployed
- Rerun `deploy_contract.py`

## Manual Deployment (Alternative)

If you prefer Remix IDE:
1. Open https://remix.ethereum.org
2. Create new file `AuditLog.sol`
3. Copy contract from `contracts/AuditLog.sol`
4. Compile with Solidity 0.8.0
5. Deploy to "Injected Provider - Ganache"
6. Copy contract address to `.env`

## Smart Contract Details

**Contract:** `AuditLog.sol`
**Function:** `storeAudit(string auditHash, uint8 riskScore)`
**Events:** `AuditStored(uint256 auditId, string auditHash, ...)`

Each transaction anchors:
- SHA-256 hash of compliance decision
- Risk score (0-255)
- Timestamp
- Auditor address
