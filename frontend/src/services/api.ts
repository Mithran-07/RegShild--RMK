
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
      if (error.response) return error.response.data;
      throw error;
    }
  },
};
