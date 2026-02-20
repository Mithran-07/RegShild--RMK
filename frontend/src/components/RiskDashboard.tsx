
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
        return <span className="bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded-full text-xs font-mono uppercase">Decentralized Authorization: CLEARED</span>;
      case "Flag for Review": 
        return <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-800 px-3 py-1 rounded-full text-xs font-mono uppercase">Warning: MANUAL REVIEW REQ</span>;
      case "Generate STR":
        return <span className="bg-red-900/30 text-red-400 border border-red-800 px-3 py-1 rounded-full text-xs font-mono uppercase animate-pulse">CRITICAL: STR GENERATION</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 bg-slate-900/50 ${getScoreColor(total_score)}`}>
           <span className="text-sm uppercase text-slate-400 mb-2">Compliance Risk Score</span>
           <span className="text-5xl font-bold">{total_score}</span>
        </div>
        
        <div className="col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col justify-center items-start">
           <div className="flex justify-between w-full mb-4">
               <div>
                  <h3 className="text-lg font-semibold text-white">Transaction Analysis</h3>
                  <p className="text-slate-400 text-sm">TX ID: {result.transaction_id}</p>
               </div>
               {getDecisionBadge(decision)}
           </div>
           
           <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
               <div 
                  className={`h-full transition-all duration-1000 ${
                      total_score < 50 ? "bg-green-500" : total_score < 80 ? "bg-yellow-500" : "bg-red-600"
                  }`} 
                  style={{ width: `${Math.min(total_score, 100)}%` }}
                ></div>
           </div>
           <div className="flex justify-between w-full text-xs text-slate-500 mt-2">
               <span>Low Risk (0-49)</span>
               <span>Review (50-79)</span>
               <span>Critical (80+)</span>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
         {/* Radar Chart */}
         <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 h-[300px]">
             <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                 <Activity size={16} /> Risk Vector Analysis
             </h4>
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Risk"
                        dataKey="A"
                        stroke={total_score > 80 ? "#ef4444" : "#3b82f6"}
                        fill={total_score > 80 ? "#ef4444" : "#3b82f6"}
                        fillOpacity={0.5}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                </RadarChart>
             </ResponsiveContainer>
         </div>

         {/* Triggered Rules List */}
         <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 overflow-y-auto max-h-[300px]">
             <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                 <AlertTriangle size={16} className="text-yellow-500" /> Triggered Compliance Rules
             </h4>
             {triggered_rules.length > 0 ? (
                 <ul className="space-y-3">
                     {triggered_rules.map((rule, idx) => (
                         <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-950/50 p-3 rounded border border-slate-800">
                             <span className="text-red-500 font-bold">•</span>
                             {rule}
                         </li>
                     ))}
                 </ul>
             ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                     <CheckCircle size={32} className="text-green-500 mb-2 opacity-50" />
                     No compliance rules violated.
                 </div>
             )}
         </div>
      </div>

      {/* STR Report Section (Conditional) */}
      {str_report_text && (
          <div className="bg-slate-900 rounded-xl border border-red-900/30 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                  <FileText size={20} /> Suspicious Transaction Report (AI Generated)
              </h3>
              <div className="bg-slate-950 p-6 rounded-lg font-mono text-sm text-slate-300 whitespace-pre-wrap border border-slate-800 max-h-[400px] overflow-y-auto leading-relaxed shadow-inner">
                  {str_report_text}
              </div>
              <div className="flex justify-end mt-4">
                  <button 
                      onClick={handleDownloadPDF}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                      Download PDF <ArrowRight className="w-3 h-3" />
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
