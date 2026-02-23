"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LedgerView from "@/components/LedgerView";
import NetworkGraph from "@/components/NetworkGraph";
import { api } from "@/services/api";
import { Database, RefreshCw, Download, AlertTriangle, CheckCircle, DollarSign, Shield } from "lucide-react";
import jsPDF from "jspdf";

interface Transaction {
  transaction_id: string;
  total_score: number;
  decision: string;
  timestamp: string;
  risk_breakdown?: Record<string, number>;
  triggered_rules?: string[];
  str_report_text?: string;
  cycle_path?: string[];  // CRISIS FEATURE 3
}

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chainStatus, setChainStatus] = useState<string>("Checking...");
  const [isVerifying, setIsVerifying] = useState(false);
  const [highRiskTransactions, setHighRiskTransactions] = useState<Transaction[]>([]);
  const [latestCyclePath, setLatestCyclePath] = useState<string[] | null>(null);
  const [showTamperAlert, setShowTamperAlert] = useState(false);
  const [tamperDetails, setTamperDetails] = useState<any>(null);
  const [showSTRModal, setShowSTRModal] = useState(false);
  const [currentSTRReport, setCurrentSTRReport] = useState<string>("");
  const [loadingSTR, setLoadingSTR] = useState(false);

  useEffect(() => {
    // Load transactions from sessionStorage (in a real app, fetch from backend)
    loadTransactionsFromStorage();
    checkChainStatus();
  }, []);

  useEffect(() => {
    // Filter high-risk transactions (score > 80)
    const highRisk = transactions.filter((txn) => txn.total_score > 80);
    setHighRiskTransactions(highRisk);
    
    // CRISIS FEATURE 3: Check for latest circular pattern
    const latestWithCycle = [...transactions].reverse().find(txn => txn.cycle_path && txn.cycle_path.length > 0);
    if (latestWithCycle?.cycle_path) {
      setLatestCyclePath(latestWithCycle.cycle_path);
    }
  }, [transactions]);

  const loadTransactionsFromStorage = () => {
    // Get transaction history array from sessionStorage
    const historyJson = sessionStorage.getItem("transactionHistory");
    if (historyJson) {
      try {
        const history = JSON.parse(historyJson);
        setTransactions(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error("Failed to parse transaction history:", error);
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  };

  const checkChainStatus = async () => {
    setIsVerifying(true);
    try {
      const response = await api.verifyLedger();
      if (response.status === "TAMPERED" || response.error) {
        setChainStatus("TAMPERED");
      } else {
        setChainStatus(response.status);
      }
    } catch (error) {
      console.error("Chain verification failed:", error);
      setChainStatus("Error");
    } finally {
      setIsVerifying(false);
    }
  };

  const simulateInsiderAttack = async () => {
    try {
      // Execute the tamper simulation
      const tamperResponse = await api.simulateTamper();
      setTamperDetails(tamperResponse);
      
      // Immediately verify the ledger to detect tampering
      await checkChainStatus();
      
      // Show the crisis alert
      setShowTamperAlert(true);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowTamperAlert(false), 10000);
    } catch (error) {
      console.error("Failed to simulate tamper:", error);
      alert("Error simulating insider attack. Ensure backend is running.");
    }
  };

  const viewSTRReport = async (transactionId: string) => {
    setLoadingSTR(true);
    setShowSTRModal(true);
    try {
      // Wait a moment for background task to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await api.getSTRReport(transactionId);
      setCurrentSTRReport(response.report);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCurrentSTRReport("STR Report is still being generated. Please try again in a moment.");
      } else {
        setCurrentSTRReport("Error loading STR report. " + (error.message || ""));
      }
    } finally {
      setLoadingSTR(false);
    }
  };

  const generateHighRiskPDF = () => {
    if (highRiskTransactions.length === 0) {
      alert("No high-risk transactions (score > 80) available for export.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("HIGH-RISK TRANSACTIONS REPORT", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 25, { align: "center" });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE SUMMARY", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total High-Risk Transactions: ${highRiskTransactions.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Threshold: ESTH Score > 80`, 20, yPosition);
    yPosition += 15;

    // Transaction Details
    highRiskTransactions.forEach((txn, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Transaction Header
      doc.setFillColor(239, 68, 68);
      doc.rect(15, yPosition - 5, pageWidth - 30, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Transaction #${index + 1}: ${txn.transaction_id}`, 20, yPosition);
      yPosition += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Risk Score
      doc.setFont("helvetica", "bold");
      doc.text(`Risk Score: ${txn.total_score.toFixed(2)}`, 20, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 7;

      // Decision
      doc.text(`Decision: ${txn.decision}`, 20, yPosition);
      yPosition += 7;

      // Timestamp
      if (txn.timestamp) {
        doc.text(`Timestamp: ${new Date(txn.timestamp).toLocaleString()}`, 20, yPosition);
        yPosition += 7;
      }

      // Risk Breakdown
      if (txn.risk_breakdown) {
        yPosition += 3;
        doc.setFont("helvetica", "bold");
        doc.text("Risk Breakdown:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 6;

        Object.entries(txn.risk_breakdown).forEach(([key, value]) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`  - ${key}: ${value.toFixed(2)}`, 25, yPosition);
          yPosition += 6;
        });
      }

      // Triggered Rules
      if (txn.triggered_rules && txn.triggered_rules.length > 0) {
        yPosition += 3;
        doc.setFont("helvetica", "bold");
        doc.text("Triggered Rules:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 6;

        txn.triggered_rules.forEach((rule) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          const lines = doc.splitTextToSize(`  • ${rule}`, pageWidth - 50);
          doc.text(lines, 25, yPosition);
          yPosition += lines.length * 6;
        });
      }

      // STR Report
      if (txn.str_report_text) {
        yPosition += 5;
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Suspicious Transaction Report:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 6;

        const reportLines = doc.splitTextToSize(txn.str_report_text, pageWidth - 50);
        reportLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 25, yPosition);
          yPosition += 6;
        });
      }

      yPosition += 10; // Space between transactions
    });

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} | RegShield AML Compliance Platform`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const filename = `HighRisk_Transactions_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-900 p-4 md:p-8 font-sans selection:bg-blue-200">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-cyan-200/20 pointer-events-none"></div>

      {/* CRISIS ALERT OVERLAY */}
      {showTamperAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-red-600 border-4 border-red-800 rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl animate-pulse">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle size={80} className="text-yellow-300 animate-bounce" />
            </div>
            <h2 className="text-4xl font-black text-white text-center mb-4 tracking-wide">
              🚨 SYSTEM FROZEN 🚨
            </h2>
            <h3 className="text-2xl font-bold text-yellow-300 text-center mb-6">
              INSIDER THREAT DETECTED
            </h3>
            <div className="bg-black/40 rounded-xl p-6 mb-6 border-2 border-yellow-400">
              <p className="text-white text-center font-semibold text-lg mb-4">
                Blockchain Integrity Check: <span className="text-red-300 font-black">TAMPERED</span>
              </p>
              {tamperDetails && (
                <div className="text-sm text-gray-200 space-y-2">
                  <p>• Transaction ID: <span className="font-mono text-yellow-300">{tamperDetails.details?.transaction_id}</span></p>
                  <p>• Original Score: <span className="text-green-400">{tamperDetails.details?.original_score}</span> → Tampered Score: <span className="text-red-400 font-bold">{tamperDetails.details?.tampered_score}</span></p>
                  <p>• Original Amount: <span className="text-green-400">${tamperDetails.details?.original_amount}</span> → Tampered: <span className="text-red-400 font-bold">${tamperDetails.details?.tampered_amount?.toFixed(2)}</span></p>
                </div>
              )}
            </div>
            <p className="text-white text-center text-lg font-semibold mb-4">
              All operations suspended. Forensic audit initiated.
            </p>
            <button
              onClick={() => setShowTamperAlert(false)}
              className="w-full bg-white hover:bg-gray-200 text-red-600 font-bold py-3 px-6 rounded-lg transition-all"
            >
              Acknowledge Alert
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
          Historical Dashboard
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          Immutable ledger, chain verification, and transaction history
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
        {/* Chain Status Card */}
        <section className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Database size={24} className="text-blue-600" />
              Chain Status
            </h2>
            <button
              onClick={checkChainStatus}
              disabled={isVerifying}
              className={`p-2 rounded-lg transition-all ${
                isVerifying
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <RefreshCw
                size={18}
                className={`text-gray-600 ${isVerifying ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-semibold">Verification Status</span>
                {chainStatus === "Verified" ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : chainStatus === "TAMPERED" ? (
                  <AlertTriangle size={20} className="text-red-500" />
                ) : null}
              </div>
              <p
                className={`text-2xl font-bold ${
                  chainStatus === "Verified"
                    ? "text-green-500"
                    : chainStatus === "TAMPERED"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {chainStatus}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <span className="text-gray-600 text-sm font-semibold">Total Transactions</span>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <span className="text-gray-600 text-sm font-semibold">High-Risk (Score &gt; 80)</span>
              <p className="text-2xl font-bold text-red-600">{highRiskTransactions.length}</p>
            </div>
          </div>

          {/* PDF Export Button */}
          <button
            onClick={generateHighRiskPDF}
            disabled={highRiskTransactions.length === 0}
            className={`w-full mt-6 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              highRiskTransactions.length > 0
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Download size={20} />
            <span>Export High-Risk PDF</span>
          </button>

          {/* CRISIS SCENARIO BUTTON */}
          <button
            onClick={simulateInsiderAttack}
            disabled={transactions.length === 0}
            className={`w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              transactions.length > 0
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-2xl border-2 border-red-800 animate-pulse"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <AlertTriangle size={20} />
            <span>Simulate Insider Attack</span>
          </button>

          {/* CRISIS FEATURE 1: Threshold Shift */}
          <button
            onClick={async () => {
              try {
                const result = await api.shiftThreshold(7000);
                alert(`✅ Threshold Shift Complete!\n\n${result.count} accounts newly flagged.\n\nCheck console for STR reports.`);
                console.log("Newly Flagged Accounts:", result.newly_flagged_accounts);
              } catch (error) {
                alert("Error applying threshold shift. Ensure backend is running.");
              }
            }}
            disabled={transactions.length === 0}
            className={`w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              transactions.length > 0
                ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <DollarSign size={20} />
            <span>Apply 30% Threshold Drop</span>
          </button>

          {/* CRISIS FEATURE 2: Weighted Risk Gating */}
          <button
            onClick={async () => {
              const accountId = prompt("Enter Account ID to test (e.g., ACC-001):");
              if (!accountId) return;
              
              try {
                // Simulate high-risk parameters
                const result = await api.applyWeightedRisk(accountId, 8.5, 9500, 1);
                alert(`${result.message}\n\nRisk Score: ${result.risk_score.toFixed(2)}/100\nStatus: ${result.status}`);
                console.log("Weighted Risk Result:", result);
              } catch (error: any) {
                if (error.response?.status === 404) {
                  alert("Account not found. Try ACC-001, ACC-002, etc.");
                } else {
                  alert("Error applying weighted risk. Ensure backend is running.");
                }
              }
            }}
            disabled={transactions.length === 0}
            className={`w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
              transactions.length > 0
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Shield size={20} />
            <span>Apply Weighted Risk Gate</span>
          </button>
        </section>

        {/* Immutable Ledger */}
        <section className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg">
              <Database size={24} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Immutable Ledger
            </span>
          </h2>

          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {transactions.length > 0 ? (
              <LedgerView newTransaction={transactions[transactions.length - 1]} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Database size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-semibold text-gray-700">No transactions recorded yet</p>
                <p className="text-sm mt-2 text-gray-600">Run a transaction test to populate the ledger</p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
                >
                  Go to Homepage
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* CRISIS FEATURE 3: Network Visualization */}
      {latestCyclePath && latestCyclePath.length > 0 && (
        <div className="relative mt-8 max-w-7xl mx-auto">
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span>🕸️</span>
              Network Analysis & Compliance Audit Portal
            </h2>
            <NetworkGraph cyclePath={latestCyclePath} />
          </section>
        </div>
      )}

      {/* Transaction History Table */}
      {transactions.length > 0 && (
        <div className="relative mt-8 max-w-7xl mx-auto">
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="pb-3 text-gray-700 font-semibold text-left">Transaction ID</th>
                    <th className="pb-3 text-gray-700 font-semibold text-left">Score</th>
                    <th className="pb-3 text-gray-700 font-semibold text-left">Decision</th>
                    <th className="pb-3 text-gray-700 font-semibold text-left">Timestamp</th>
                    <th className="pb-3 text-gray-700 font-semibold text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 text-gray-900 font-mono text-sm">{txn.transaction_id}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            txn.total_score > 80
                              ? "bg-red-500/20 text-red-400"
                              : txn.total_score > 50
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {txn.total_score.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 text-gray-700">{txn.decision}</td>
                      <td className="py-4 text-gray-600 text-sm">
                        {txn.timestamp ? new Date(txn.timestamp).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              sessionStorage.setItem("latestResult", JSON.stringify(txn));
                              router.push("/results");
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                          >
                            View Details
                          </button>
                          {txn.total_score > 80 && (
                            <button
                              onClick={() => viewSTRReport(txn.transaction_id)}
                              className="text-red-400 hover:text-red-300 text-sm font-semibold ml-2"
                            >
                              View STR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* STR Report Modal */}
      {showSTRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={28} />
                Suspicious Transaction Report (STR)
              </h2>
              <button
                onClick={() => setShowSTRModal(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingSTR ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin" size={32} />
                  <span className="ml-3 text-gray-600">Loading STR Report...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">
                  {currentSTRReport}
                </pre>
              )}
            </div>
            <div className="bg-gray-100 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowSTRModal(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([currentSTRReport], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `STR_Report_${Date.now()}.txt`;
                  a.click();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </main>
  );
}
