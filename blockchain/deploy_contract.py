#!/usr/bin/env python3
"""
Deploy AuditLog contract to Ganache
"""
import json
from web3 import Web3
from solcx import compile_source, install_solc
import os

# Install Solidity compiler
print("📦 Installing Solidity compiler...")
install_solc('0.8.0')

# Read contract source
contract_path = os.path.join(os.path.dirname(__file__), 'contracts', 'AuditLog.sol')
with open(contract_path, 'r') as f:
    contract_source = f.read()

print("🔨 Compiling AuditLog.sol...")
compiled_sol = compile_source(contract_source, output_values=['abi', 'bin'])
contract_interface = compiled_sol['<stdin>:AuditLog']

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
print(f"🌐 Connected to Ganache: {w3.is_connected()}")

if not w3.is_connected():
    print("❌ ERROR: Cannot connect to Ganache. Make sure it's running on port 7545")
    exit(1)

# Get accounts
accounts = w3.eth.accounts
deployer = accounts[0]
print(f"👤 Deployer address: {deployer}")
print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(deployer), 'ether')} ETH")

# Deploy contract
AuditLog = w3.eth.contract(abi=contract_interface['abi'], bytecode=contract_interface['bin'])

print("\n🚀 Deploying contract...")
tx_hash = AuditLog.constructor().transact({'from': deployer})
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

contract_address = tx_receipt.contractAddress
print(f"\n✅ Contract deployed at: {contract_address}")
print(f"📦 Transaction hash: {tx_hash.hex()}")
print(f"⛽ Gas used: {tx_receipt.gasUsed}")

# Save deployment info
deployment_info = {
    'contract_address': contract_address,
    'deployer': deployer,
    'tx_hash': tx_hash.hex(),
    'abi': contract_interface['abi']
}

output_path = os.path.join(os.path.dirname(__file__), 'deployment.json')
with open(output_path, 'w') as f:
    json.dump(deployment_info, f, indent=2)

print(f"\n💾 Deployment info saved to: deployment.json")

# Test the contract
print("\n🧪 Testing contract...")
audit_log = w3.eth.contract(address=contract_address, abi=contract_interface['abi'])
count = audit_log.functions.getAuditCount().call()
print(f"✅ Initial audit count: {count}")

print("\n" + "="*60)
print("📋 COPY THESE VALUES TO YOUR .env FILE:")
print("="*60)
print(f"ETH_RPC_URL=http://127.0.0.1:7545")
print(f"ETH_CONTRACT_ADDRESS={contract_address}")
print(f"ETH_SENDER_ADDRESS={deployer}")
print(f"ETH_PRIVATE_KEY=<GET_FROM_GANACHE_UI>")
print("="*60)
print("\n⚠️  Don't forget to copy the PRIVATE KEY from Ganache UI!")
print(f"   1. Open Ganache")
print(f"   2. Click the key icon next to {deployer}")
print(f"   3. Copy the private key")
print(f"   4. Add it to your .env file")
