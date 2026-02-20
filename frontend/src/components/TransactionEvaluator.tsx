
"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { ArrowRight, Loader2 } from "lucide-react";

interface TransactionEvaluatorProps {
  onEvaluate: (result: any) => void;
}

export default function TransactionEvaluator({ onEvaluate }: TransactionEvaluatorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Transaction_ID: "TXN-" + Math.floor(Math.random() * 10000),
    Sender_Account_ID: "ACC-004", // Default high risk (Panama)
    Receiver_Account_ID: "ACC-001",
    Amount: 5000,
    Timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.evaluateTransaction(formData);
      onEvaluate(result);
    } catch (error) {
      alert("Failed to evaluate transaction. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type: "clean" | "suspicious") => {
    if (type === "clean") {
      setFormData({
        Transaction_ID: "TXN-" + Math.floor(Math.random() * 10000),
        Sender_Account_ID: "ACC-001", // USA, Verified
        Receiver_Account_ID: "ACC-003", // UK, Verified
        Amount: 500,
        Timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      });
    } else {
      setFormData({
        Transaction_ID: "TXN-" + Math.floor(Math.random() * 10000),
        Sender_Account_ID: "ACC-004", // Panama
        Receiver_Account_ID: "ACC-001",
        Amount: 12000, // Structuring risk potential
        Timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => loadExample("clean")}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-green-400 px-3 py-1 rounded-md transition-colors"
        >
          Load Clean Tx
        </button>
        <button
          type="button"
          onClick={() => loadExample("suspicious")}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-red-400 px-3 py-1 rounded-md transition-colors"
        >
          Load High-Risk Tx
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tx ID</label>
            <input
              name="Transaction_ID"
              value={formData.Transaction_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Timestamp</label>
            <input
              name="Timestamp"
              value={formData.Timestamp}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Sender ID</label>
            <input
              name="Sender_Account_ID"
              value={formData.Sender_Account_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Receiver ID</label>
            <input
              name="Receiver_Account_ID"
              value={formData.Receiver_Account_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
        </div>

        <div>
           <label className="text-xs text-slate-400 block mb-1">Amount (USD)</label>
           <input
              name="Amount"
              type="number"
              value={formData.Amount}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-mono"
            />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/20"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Run Compliance Check <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
