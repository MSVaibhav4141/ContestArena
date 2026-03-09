"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer({ targetDate, label }: { targetDate: string, label: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        clearInterval(interval);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return;
      }

      // Calculate time components
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Pad with zeros
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Premium Loading Skeleton that matches the exact shape of the rendered component
  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 bg-[#1e1e1e] border border-gray-800 px-3 py-1.5 rounded-lg h-[34px] w-36 animate-pulse shadow-sm">
        <div className="w-3.5 h-3.5 rounded-full bg-gray-700/50"></div>
        <div className="h-3 w-20 bg-gray-700/50 rounded ml-1"></div>
      </div>
    );
  }

  // UI logic: If the contest is active ("Ends in"), make it Emerald. If upcoming ("Starts in"), make it Blue.
  const isEnding = label.toLowerCase().includes("ends");

  return (
    <div className={`flex items-center gap-2 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-300 ${
      isEnding 
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
        : "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
    }`}>
      <Clock size={15} className={isEnding ? "text-emerald-500/80" : "text-blue-400/80"} />
      <span className="tracking-wide flex items-center">
        <span className="opacity-75 font-sans text-[10px] uppercase tracking-wider mr-2 mt-0.5">
          {label}
        </span>
        {/* tabular-nums prevents the box from jittering left and right as numbers change (e.g., from 1 to 0) */}
        <span className="tabular-nums tracking-tight">{timeLeft}</span>
      </span>
    </div>
  );
}