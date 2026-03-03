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
        // Optional: window.location.reload() to refresh the page when contest starts
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <div className="animate-pulse bg-gray-800 h-6 w-24 rounded"></div>;

  return (
    <div className="flex items-center gap-2 text-blue-400 font-mono font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
      <Clock size={16} />
      <span>{label} {timeLeft}</span>
    </div>
  );
}