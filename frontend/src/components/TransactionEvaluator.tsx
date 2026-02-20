
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
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => loadExample("clean")}
          className="flex-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 hover:from-green-800/40 hover:to-emerald-800/40 text-green-400 border border-green-700/50 hover:border-green-600 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold shadow-lg hover:shadow-green-500/20"
        >
          ✓ Load Clean Tx
        </button>
        <button
          type="button"
          onClick={() => loadExample("suspicious")}
          className="flex-1 bg-gradient-to-r from-red-900/30 to-orange-900/30 hover:from-red-800/40 hover:to-orange-800/40 text-red-400 border border-red-700/50 hover:border-red-600 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold shadow-lg hover:shadow-red-500/20"
        >
          ⚠ Load High-Risk Tx
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Transaction ID</label>
            <input
              name="Transaction_ID"
              value={formData.Transaction_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Timestamp</label>
            <input
              name="Timestamp"
              value={formData.Timestamp}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Sender Account</label>
            <input
              name="Sender_Account_ID"
              value={formData.Sender_Account_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Receiver Account</label>
            <input
              name="Receiver_Account_ID"
              value={formData.Receiver_Account_ID}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
           <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Amount (USD)</label>
           <input
              name="Amount"
              type="number"
              value={formData.Amount}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white font-mono transition-all shadow-inner"
            />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:cursor-not-allowed shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] group mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              <span className="text-base">Analyzing Transaction...</span>
            </>
          ) : (
            <>
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-base">Run Compliance Check</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
