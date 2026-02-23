
import json
import os
import google.generativeai as genai
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def generate_str_report(transaction_details, triggered_rules):
    """
    Generates a Suspicious Transaction Report (STR) using an LLM.
    
    Args:
        transaction_details (dict): The confirmed transaction details.
        triggered_rules (list): List of rule names/descriptions that triggered the flag.
        
    Returns:
        str: The generated report text.
    """
    
    prompt = f"""
    You are a strictly regulated Compliance Reporting AI. 
    Your task is to draft a formal Suspicious Transaction Report (STR) for financial regulators. 

    STRICT RULES:
    1. Do NOT make any compliance decisions or judgments on your own.
    2. Base your report STRICTLY on the triggered rules provided below.
    3. Do NOT invent new data or hallucinate details not present in the input.
    4. Format the output as a professional, legal-grade document with sections: Header, Subject Details, Transaction Analysis, and Conclusion.

    TRIGGERED RULES:
    {json.dumps(triggered_rules, indent=2)}
    
    TRANSACTION DETAILS:
    {json.dumps(transaction_details, indent=2)}
    
    Draft the report now.
    """

    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    api_key = os.getenv("LLM_API_KEY")

    try:
        if provider == "gemini" and api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return response.text

        elif provider == "openai" and api_key:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": "You are a professional Compliance Reporting Assistant."},
                          {"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        elif provider == "groq" and api_key:
            client = Groq(api_key=api_key)
            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional Compliance Reporting Assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"), 
            )
            return completion.choices[0].message.content

    except Exception as e:
        print(f"LLM Generation Failed: {e}")
        # FALLBACK: Generate mock STR if LLM fails
        pass
    
    # Mock STR if no LLM provider configured or failed
    from datetime import datetime
    return f"""
═══════════════════════════════════════════════════════════════════
              SUSPICIOUS TRANSACTION REPORT (STR)
═══════════════════════════════════════════════════════════════════
Report ID: STR-{transaction_details.get('Transaction_ID', 'UNKNOWN')}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Reporting Entity: RegShield AML Compliance System

─────────────────────────────────────────────────────────────────
1. TRANSACTION DETAILS
─────────────────────────────────────────────────────────────────
Transaction ID: {transaction_details.get('Transaction_ID', 'N/A')}
Sender: {transaction_details.get('Sender_Account_ID', 'N/A')}
Receiver: {transaction_details.get('Receiver_Account_ID', 'N/A')}
Amount: ${transaction_details.get('Amount', 0):,.2f} {transaction_details.get('Currency', 'USD')}
Timestamp: {transaction_details.get('Timestamp', 'N/A')}

─────────────────────────────────────────────────────────────────
2. COMPLIANCE VIOLATIONS DETECTED
─────────────────────────────────────────────────────────────────
{'\n'.join(f'• {rule}' for rule in triggered_rules)}

─────────────────────────────────────────────────────────────────
3. REGULATORY ASSESSMENT
─────────────────────────────────────────────────────────────────
This transaction has been flagged for exhibiting multiple high-risk
indicators consistent with potential money laundering activities.

RECOMMENDATION: Enhanced Due Diligence (EDD) Required
ACTION: Transaction held for manual review by compliance officer

═══════════════════════════════════════════════════════════════════
This report is generated for regulatory compliance purposes only.
═══════════════════════════════════════════════════════════════════
"""
    
    # Fallback / Mock Response for Default
    mock_report = f"""
    [MOCK REPORT - LLM KEYS NOT CONFIGURED]
    SUSPICIOUS TRANSACTION REPORT (STR)
    -----------------------------------
    DATE: {transaction_details.get("Timestamp", "N/A")}
    TRANSACTION ID: {transaction_details.get("Transaction_ID", "N/A")}
    
    SUMMARY OF SUSPICION:
    The following compliance rules were triggered during automated screening:
    {', '.join(triggered_rules)}
    
    DETAILS:
    Subject Account {transaction_details.get("Sender_Account_ID")} initiated a transfer of {transaction_details.get("Amount")} to {transaction_details.get("Receiver_Account_ID")}.
    
    ANALYSIS:
    This activity deviates from the expected profile. The specific triggers indicate potential money laundering risks associated with {triggered_rules[0] if triggered_rules else "unknown factors"}.
    
    RECOMMENDATION:
    Immediate freeze recommended. Elevate to Level 2 Investigation.
    """
    
    return mock_report.strip()
