
"use client";

import { AlertTriangle, CheckCircle, XCircle, FileText, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

import jsPDF from "jspdf";

interface RiskDashboardProps {
  result: {
    transaction_id: string;
    total_score: number;
    decision: string;
    risk_breakdown: Record<string, number>;
    triggered_rules: string[];
    str_report_text?: string;
  };
}

export default function RiskDashboard({ result }: RiskDashboardProps) {
  const { total_score, decision, risk_breakdown, triggered_rules, str_report_text } = result;

  const chartData = Object.keys(risk_breakdown).map((key) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: risk_breakdown[key],
    fullMark: 100, // Normalized for radar
  }));

  const handleDownloadPDF = async () => {
    if (!str_report_text) return;
    
    // Generate SHA-256 Hash of the report content
    const msgBuffer = new TextEncoder().encode(str_report_text + result.transaction_id);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const doc = new jsPDF();
    doc.setFont("courier"); // Use a fixed-width font for technical look

    // Title
    doc.setFontSize(18);
    doc.text("Suspicious Transaction Report (STR)", 20, 20);

    // Metadata Header
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Transaction ID: ${result.transaction_id}`, 20, 30);
    doc.text(`Generated: ${new Date().toISOString()}`, 20, 35);
    doc.text(`SHA-256 Hash: ${hashHex}`, 20, 40);
    doc.setTextColor(0); // Reset color
    
    // Separator Line
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Content Body
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(str_report_text, 170);
    doc.text(splitText, 20, 55);
    
    // Footer Verification
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Digital Fingerprint: ${hashHex}`, 20, 280);

    doc.save(`STR_${result.transaction_id}.pdf`);
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-green-500 border-green-500";
    if (score < 80) return "text-yellow-500 border-yellow-500";
    return "text-red-500 border-red-500";
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "Clear":
        return <span className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400 border border-green-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-green-500/20">✓ Cleared</span>;
      case "Flag for Review": 
        return <span className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 text-yellow-400 border border-yellow-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/20">⚠ Manual Review</span>;
      case "Generate STR":
        return <span className="bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-400 border border-red-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse shadow-lg shadow-red-500/30">⚠️ STR Required</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-gradient-to-br from-slate-900/80 to-slate-800/80 shadow-2xl ${getScoreColor(total_score)}`}>
           <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
           <span className="text-xs uppercase text-slate-400 mb-3 font-bold tracking-widest relative z-10">Risk Score</span>
           <span className="text-6xl font-black relative z-10 tracking-tight">{total_score}</span>
           <span className="text-xs text-slate-500 mt-2 relative z-10">/ 100</span>
        </div>
        
        <div className="col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-slate-700 p-6 flex flex-col justify-center items-start shadow-2xl">
           <div className="flex justify-between w-full mb-5">
               <div>
                  <h3 className="text-xl font-bold text-white">Transaction Analysis</h3>
                  <p className="text-slate-400 text-sm mt-1 font-mono">ID: {result.transaction_id}</p>
               </div>
               {getDecisionBadge(decision)}
           </div>
           
           <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden shadow-inner relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
               <div 
                  className={`h-full transition-all duration-1000 shadow-lg relative z-10 ${
                      total_score < 50 ? "bg-gradient-to-r from-green-500 to-emerald-500" : total_score < 80 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-red-600 to-red-700"
                  }`} 
                  style={{ width: `${Math.min(total_score, 100)}%` }}
                ></div>
           </div>
           <div className="flex justify-between w-full text-xs font-semibold mt-3">
               <span className="text-green-400">✓ Low (0-49)</span>
               <span className="text-yellow-400">⚠ Review (50-79)</span>
               <span className="text-red-400">⛔ Critical (80+)</span>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
         {/* Radar Chart */}
         <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-slate-700 p-6 h-[320px] shadow-2xl">
             <h4 className="text-base font-bold text-white mb-4 flex items-center gap-3">
                 <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                   <Activity size={16} className="text-white" />
                 </div>
                 <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Risk Vector Analysis</span>
             </h4>
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#334155" strokeWidth={1.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Risk"
                        dataKey="A"
                        stroke={total_score > 80 ? "#ef4444" : "#06b6d4"}
                        fill={total_score > 80 ? "#ef4444" : "#06b6d4"}
                        fillOpacity={0.6}
                        strokeWidth={2}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    />
                </RadarChart>
             </ResponsiveContainer>
         </div>

         {/* Triggered Rules List */}
         <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-slate-700 p-6 overflow-y-auto max-h-[320px] shadow-2xl">
             <h4 className="text-base font-bold text-white mb-4 flex items-center gap-3">
                 <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                   <AlertTriangle size={16} className="text-white" />
                 </div>
                 <span className="bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">Triggered Rules</span>
             </h4>
             {triggered_rules.length > 0 ? (
                 <ul className="space-y-3">
                     {triggered_rules.map((rule, idx) => (
                         <li key={idx} className="flex gap-3 text-sm text-slate-200 bg-slate-950/60 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-all shadow-lg">
                             <span className="text-red-400 font-bold text-lg leading-none">•</span>
                             <span className="flex-1 leading-relaxed">{rule}</span>
                         </li>
                     ))}
                 </ul>
             ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                     <CheckCircle size={48} className="text-green-500 mb-3 opacity-60" />
                     <p className="text-sm font-semibold">No violations detected</p>
                 </div>
             )}
         </div>
      </div>

      {/* STR Report Section (Conditional) */}
      {str_report_text && (
          <div className="bg-gradient-to-br from-red-950/40 to-red-900/40 rounded-2xl border-2 border-red-800/50 p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-red-700"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              <h3 className="relative z-10 text-xl font-bold text-red-400 mb-5 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg">
                    <FileText size={22} className="text-white" />
                  </div>
                  <span>Suspicious Transaction Report</span>
                  <span className="text-xs bg-red-900/60 text-red-300 px-3 py-1 rounded-full border border-red-700 font-mono">AI Generated</span>
              </h3>
              <div className="relative z-10 bg-slate-950/80 p-6 rounded-xl font-mono text-sm text-slate-300 whitespace-pre-wrap border border-slate-700 max-h-[400px] overflow-y-auto leading-relaxed shadow-2xl custom-scrollbar">
                  {str_report_text}
              </div>
              <div className="relative z-10 flex justify-end mt-5">
                  <button 
                      onClick={handleDownloadPDF}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                      <FileText size={18} />
                      <span>Download STR Report (PDF)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}

// Helper icon
function ArrowRight({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}
