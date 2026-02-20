
"use client";

import { useState } from "react";
import TransactionEvaluator from "@/components/TransactionEvaluator";
import RiskDashboard from "@/components/RiskDashboard";
import LedgerView from "@/components/LedgerView";
import { ShieldCheck, Activity, Database } from "lucide-react";

export default function Home() {
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // New transaction handler to pass to LedgerView
  const handleNewTransaction = (result: any) => {
      setEvaluationResult(result);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 font-sans selection:bg-blue-500/30">
      <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              RegShield
            </h1>
            <p className="text-slate-400 text-sm font-light tracking-wide">Real-Time AML & Compliance Engine</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-700 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-xs font-mono text-slate-300 tracking-wider">SYSTEM ONLINE</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-700 shadow-sm">
             <Activity size={14} className="text-blue-400"/>
             <span className="text-xs font-mono text-slate-300 tracking-wider">GANACHE: CONNECTED</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Ledger */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white border-b border-slate-800 pb-2">
              <Activity size={18} className="text-blue-400" />
              Transaction Stream
            </h2>
            <TransactionEvaluator onEvaluate={handleNewTransaction} />
          </section>

          <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-2xl h-[600px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white border-b border-slate-800 pb-2">
              <Database size={18} className="text-purple-400" />
              Immutable Ledger
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               <LedgerView newTransaction={evaluationResult} />
            </div>
          </section>
        </div>

        {/* Right Column: Risk Dashboard */}
        <div className="lg:col-span-8">
          <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl min-h-[800px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
            
            {evaluationResult ? (
              <RiskDashboard result={evaluationResult} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="p-8 bg-slate-900 rounded-full border border-slate-800 shadow-2xl">
                    <ShieldCheck size={64} strokeWidth={1} className="text-slate-700" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-medium text-slate-500">Waiting for transaction data...</p>
                    <p className="text-sm max-w-md text-slate-600 mt-2 mx-auto leading-relaxed">
                    Submit a transaction payload to trigger the 6-layer deterministic rule engine and generate a compliance risk score.
                    </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
