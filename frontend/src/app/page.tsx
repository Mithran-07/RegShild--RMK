
"use client";

import { useState } from "react";
import TransactionEvaluator from "@/components/TransactionEvaluator";
import RiskDashboard from "@/components/RiskDashboard";
import LedgerView from "@/components/LedgerView";
import LiveFeedSimulator from "@/components/LiveFeedSimulator";
import { ShieldCheck, Activity, Database } from "lucide-react";

export default function Home() {
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // New transaction handler to pass to LedgerView
  const handleNewTransaction = (result: any) => {
      setEvaluationResult(result);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
      
      <header className="relative mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800/50 pb-6 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl blur-md opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 p-3 rounded-xl shadow-2xl">
              <ShieldCheck size={36} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent tracking-tight">
              RegShield
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-light tracking-wide mt-1">Real-Time AML & Compliance Monitoring Engine</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-full border border-green-500/30 shadow-lg shadow-green-500/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
            <span className="text-xs font-mono text-green-400 tracking-wider font-semibold">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-full border border-blue-500/30 shadow-lg shadow-blue-500/10">
             <Activity size={14} className="text-blue-400 animate-pulse"/>
             <span className="text-xs font-mono text-blue-400 tracking-wider font-semibold">BLOCKCHAIN ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Input & Ledger */}
        <div className="lg:col-span-4 space-y-6">
          <section className="group bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/30">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                <Activity size={18} className="text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Live Feed Simulator</span>
            </h2>
            <LiveFeedSimulator onTransactionReceived={handleNewTransaction} />
          </section>

          <section className="group bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:border-cyan-500/30">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg">
                <Activity size={18} className="text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">Manual Transaction Test</span>
            </h2>
            <TransactionEvaluator onEvaluate={handleNewTransaction} />
          </section>

          <section className="group bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30 h-[600px] flex flex-col">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                <Database size={18} className="text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Immutable Ledger</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               <LedgerView newTransaction={evaluationResult} />
            </div>
          </section>
        </div>

        {/* Right Column: Risk Dashboard */}
        <div className="lg:col-span-8">
          <section className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-2xl min-h-[800px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            {evaluationResult ? (
              <div className="relative z-10">
                <RiskDashboard result={evaluationResult} />
              </div>
            ) : (
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-slate-600 space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full border border-slate-700 shadow-2xl">
                    <ShieldCheck size={72} strokeWidth={1.5} className="text-slate-600" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                    <p className="text-2xl font-bold bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent">Awaiting Transaction Analysis</p>
                    <p className="text-sm max-w-lg text-slate-500 mx-auto leading-relaxed px-4">
                      Submit a transaction through the <span className="text-blue-400 font-semibold">Live Feed</span> or <span className="text-cyan-400 font-semibold">Manual Test</span> to trigger the 6-layer deterministic compliance engine and generate a real-time risk assessment.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
