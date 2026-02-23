"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RiskDashboard from "@/components/RiskDashboard";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve result from sessionStorage
    const storedResult = sessionStorage.getItem("latestResult");
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setResult(parsedResult);
      } catch (error) {
        console.error("Failed to parse stored result:", error);
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-900 p-4 md:p-8">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-900 p-4 md:p-8">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-cyan-200/20 pointer-events-none"></div>
        
        <div className="relative flex flex-col items-center justify-center h-[80vh] space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-10 bg-white rounded-full border-2 border-gray-200 shadow-xl">
              <ShieldCheck size={72} strokeWidth={1.5} className="text-gray-400" />
            </div>
          </div>
          <div className="text-center space-y-4">
            <p className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
              No Results Available
            </p>
            <p className="text-gray-600 max-w-md">
              Please run a transaction test from the homepage to see compliance analysis results.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft size={20} />
            <span>Back to Homepage</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-900 p-4 md:p-8 font-sans selection:bg-blue-200">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-cyan-200/20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative mb-8 flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Transaction Analysis Results
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Comprehensive compliance assessment and risk evaluation
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all duration-200 border-2 border-gray-300 hover:border-gray-400 shadow-md"
        >
          <ArrowLeft size={20} />
          <span>New Test</span>
        </button>
      </div>

      {/* Results Dashboard */}
      <div className="relative max-w-7xl mx-auto">
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-cyan-100/30 to-blue-100/30 rounded-2xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <RiskDashboard result={result} />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
          >
            <span>🔄</span>
            <span>Run Another Test</span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>📊</span>
            <span>View Dashboard</span>
          </button>
        </div>
      </div>
    </main>
  );
}
