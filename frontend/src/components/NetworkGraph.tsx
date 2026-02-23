"use client";

import { useEffect, useRef } from "react";

interface NetworkGraphProps {
  cyclePath: string[] | null | undefined;
}

export default function NetworkGraph({ cyclePath }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!cyclePath || cyclePath.length < 2 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate positions for nodes in a circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    const nodeRadius = 30;

    const positions = cyclePath.map((_, index) => {
      const angle = (index * 2 * Math.PI) / cyclePath.length - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Draw edges (arrows)
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#fbbf24";

    for (let i = 0; i < cyclePath.length - 1; i++) {
      const start = positions[i];
      const end = positions[i + 1];

      // Draw line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowSize = 15;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle - Math.PI / 6),
        end.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - arrowSize * Math.cos(angle + Math.PI / 6),
        end.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw nodes
    cyclePath.forEach((accountId, index) => {
      const pos = positions[index];

      // Draw circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = index === 0 ? "#dc2626" : "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = accountId.length > 8 ? accountId.slice(0, 8) + "..." : accountId;
      ctx.fillText(label, pos.x, pos.y);
    });
  }, [cyclePath]);

  if (!cyclePath || cyclePath.length < 2) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border-2 border-gray-700 text-center">
        <p className="text-gray-500 text-lg">
          No circular transaction pattern detected
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Run transactions with circular patterns to see network visualization
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border-2 border-red-500 shadow-2xl">
      <h3 className="text-2xl font-bold text-red-400 mb-4 text-center flex items-center justify-center gap-2">
        <span>🕸️</span>
        Circular Fund Transfer Detected
      </h3>
      <div className="bg-black/50 rounded-lg p-4 mb-4">
        <p className="text-gray-300 text-sm font-mono text-center">
          Path: {cyclePath.join(" → ")}
        </p>
        <p className="text-red-400 text-xs text-center mt-2 font-semibold">
          ⚠️ Money laundering pattern: {cyclePath.length} nodes in cycle
        </p>
      </div>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="bg-black rounded-lg"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-red-500/20 p-3 rounded-lg border border-red-500/50">
          <p className="text-red-400 font-bold">Risk Level</p>
          <p className="text-white text-2xl">+40 Points</p>
        </div>
        <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/50">
          <p className="text-yellow-400 font-bold">Pattern Type</p>
          <p className="text-white text-xl">Circular Layering</p>
        </div>
      </div>
    </div>
  );
}
