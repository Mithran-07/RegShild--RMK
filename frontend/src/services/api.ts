
import axios from "axios";

// Assuming backend is running on 127.0.0.1:8000
const API_BASE_URL = "http://127.0.0.1:8000/api";

export const api = {
  // Evaluate a transaction
  evaluateTransaction: async (data: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate`, data);
      return response.data;
    } catch (error) {
      console.error("API Error - Evaluate:", error);
      throw error;
    }
  },

  // Verify Ledger Integrity
  verifyLedger: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/verify_ledger`);
      return response.data;
    } catch (error: any) {
      console.error("API Error - Verify Ledger:", error);
      // Return the error response if available (e.g. TAMPERED 409)
      if (error.response) {
        return { status: "TAMPERED", error: error.response.data };
      }
      throw error;
    }
  },

  // Simulate Insider Threat (Tamper Attack)
  simulateTamper: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/simulate_tamper`);
      return response.data;
    } catch (error) {
      console.error("API Error - Simulate Tamper:", error);
      throw error;
    }
  },

  // CRISIS FEATURE 1: Adaptive Threshold Shift
  shiftThreshold: async (newThreshold: number = 7000) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/shift_threshold?new_threshold=${newThreshold}`);
      return response.data;
    } catch (error) {
      console.error("API Error - Shift Threshold:", error);
      throw error;
    }
  },

  // CRISIS FEATURE 2: Apply Weighted Risk
  applyWeightedRisk: async (accountId: string, velocity: number, geoEntropy: number, hops: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/apply_weighted_risk`, null, {
        params: { account_id: accountId, velocity, geo_entropy: geoEntropy, hops_to_blacklist: hops }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Weighted Risk:", error);
      throw error;
    }
  },

  // Get STR Report
  getSTRReport: async (transactionId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/${transactionId}`);
      // Backend returns {transaction_id: ..., report: ...}, extract the report text
      return response.data.report || response.data;
    } catch (error) {
      console.error("API Error - Get STR Report:", error);
      throw error;
    }
  },
};
