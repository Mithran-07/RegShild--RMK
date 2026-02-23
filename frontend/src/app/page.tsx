
"use client";

import { useRouter } from "next/navigation";
import TransactionEvaluator from "@/components/TransactionEvaluator";
import LiveFeedSimulator from "@/components/LiveFeedSimulator";
import { Activity, TestTube } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleTransactionEvaluated = (result: any) => {
    // Add timestamp if not present
    const transactionWithTimestamp = {
      ...result,
      timestamp: result.timestamp || new Date().toISOString(),
    };
    
    // Store in latestResult for results page
    sessionStorage.setItem("latestResult", JSON.stringify(transactionWithTimestamp));
    
    // Add to transaction history array
    const historyJson = sessionStorage.getItem("transactionHistory");
    let history = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch (error) {
        console.error("Failed to parse history:", error);
      }
    }
    history.unshift(transactionWithTimestamp); // Add to beginning
    sessionStorage.setItem("transactionHistory", JSON.stringify(history));
    
    // Navigate to results page
    router.push("/results");
  };

  const handleLiveFeedTransaction = (transaction: any) => {
    // Add timestamp if not present
    const transactionWithTimestamp = {
      ...transaction,
      timestamp: transaction.timestamp || new Date().toISOString(),
    };
    
    // Store in latestResult for results page
    sessionStorage.setItem("latestResult", JSON.stringify(transactionWithTimestamp));
    
    // Add to transaction history array
    const historyJson = sessionStorage.getItem("transactionHistory");
    let history = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch (error) {
        console.error("Failed to parse history:", error);
      }
    }
    history.unshift(transactionWithTimestamp); // Add to beginning
    sessionStorage.setItem("transactionHistory", JSON.stringify(history));
    
    // Navigate to results page
    router.push("/results");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-900 p-4 md:p-8 font-sans selection:bg-blue-200">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-cyan-200/20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
          AML Compliance Testing
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          Test transactions manually or simulate live feed for real-time compliance monitoring
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-7xl mx-auto">
        {/* Manual Transaction Test */}
        <section className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-200/50 transition-all duration-300 hover:border-cyan-300">
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg">
              <TestTube size={24} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Manual Transaction Test</span>
          </h2>
          <p className="text-gray-600 mb-6">
            Enter transaction details to run a compliance check instantly
          </p>
          <TransactionEvaluator onEvaluate={handleTransactionEvaluated} />
        </section>

        {/* Live Feed Simulator */}
        <section className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 hover:border-blue-300">
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
              <Activity size={24} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Live Transaction Feed</span>
          </h2>
          <p className="text-gray-600 mb-6">
            Stream simulated transactions for continuous monitoring
          </p>
          <LiveFeedSimulator onTransactionReceived={handleLiveFeedTransaction} />
        </section>
      </div>

      {/* Dashboard Link */}
      <div className="relative mt-10 text-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="text-2xl">📊</span>
          <span className="text-lg">View Historical Dashboard</span>
        </button>
      </div>
    </main>
  );
}
