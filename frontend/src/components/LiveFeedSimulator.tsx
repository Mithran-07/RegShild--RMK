"use client";

import { useState, useRef } from "react";
import { Play, Pause, Square, Activity, AlertCircle } from "lucide-react";

interface LiveFeedSimulatorProps {
  onTransactionReceived: (transaction: any) => void;
}

export default function LiveFeedSimulator({ onTransactionReceived }: LiveFeedSimulatorProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);

  const startLiveFeed = () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setProcessedCount(0);
    setCurrentStatus("connecting");

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource("http://127.0.0.1:8000/api/stream/live");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setCurrentStatus("streaming");
      console.log("🟢 Live feed connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === "started") {
          setTotalCount(data.total);
          setCurrentStatus("streaming");
        } else if (data.status === "completed") {
          setCurrentStatus("completed");
          stopLiveFeed();
        } else if (data.error) {
          console.error("Stream error:", data.error);
          setCurrentStatus("error");
        } else if (data.transaction_id) {
          // Valid transaction received
          setProcessedCount((prev) => prev + 1);
          onTransactionReceived(data);
        }
      } catch (error) {
        console.error("Error parsing stream data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setCurrentStatus("error");
      stopLiveFeed();
    };
  };

  const stopLiveFeed = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    if (currentStatus !== "completed" && currentStatus !== "error") {
      setCurrentStatus("stopped");
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "connecting":
        return (
          <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-2 border-blue-300 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 animate-pulse shadow-md">
            <Activity size={14} className="animate-spin" />
            Connecting to Stream...
          </span>
        );
      case "streaming":
        return (
          <span className="bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 border-2 border-green-300 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            Live Stream Active
          </span>
        );
      case "completed":
        return (
          <span className="bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border-2 border-emerald-300 px-4 py-2 rounded-full text-xs font-semibold shadow-md">
            ✓ Stream Completed
          </span>
        );
      case "error":
        return (
          <span className="bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-2 border-red-300 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md">
            <AlertCircle size={14} />
            Connection Error
          </span>
        );
      case "stopped":
        return (
          <span className="bg-slate-800/60 text-slate-400 border border-slate-700 px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
            Stream Stopped
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 border-2 border-gray-300 px-4 py-2 rounded-full text-xs font-semibold shadow-md">
            Ready to Stream
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="space-y-2 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-600">Processing Transactions</span>
              <span className="text-cyan-600">
                {processedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 transition-all duration-500 shadow-md animate-gradient"
                style={{ 
                  width: `${(processedCount / totalCount) * 100}%`,
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {Math.round((processedCount / totalCount) * 100)}% Complete
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isStreaming ? (
            <button
              onClick={startLiveFeed}
              className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <Play size={22} className="relative z-10" />
              <span className="relative z-10 text-base">Start Live Feed</span>
            </button>
          ) : (
            <button
              onClick={stopLiveFeed}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Square size={22} />
              <span className="text-base">Stop Stream</span>
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 shadow-md">
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">⚡ Live Monitoring:</span> Streams transactions from your dataset with 1.5s intervals, evaluating each through the 6-layer compliance engine in real-time. Perfect for live demos.
          </p>
        </div>
      </div>
    </div>
  );
}
