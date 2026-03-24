"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, Activity, CheckCircle, CodeSquare, ChevronRight, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContestData {
  id: string;
  title: string;
  description: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  participantCount: number;
  problemCount: number;
  startTime: string;
  endTime: string;
}

export default function ContestExplorer({ initialContests }: { initialContests: ContestData[] }) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "UPCOMING" | "ENDED">("ACTIVE");
  const filtered = initialContests.filter((c) => c.status === activeTab);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const tabs: { label: string; value: "ACTIVE" | "UPCOMING" | "ENDED" }[] = [
    { label: "Live Now", value: "ACTIVE" },
    { label: "Upcoming", value: "UPCOMING" },
    { label: "Past", value: "ENDED" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-gray-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              activeTab === tab.value ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-[#2a2a2a] rounded-lg border border-gray-700"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.value === "ACTIVE" && activeTab === "ACTIVE" && (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              )}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="text-center py-24 border border-gray-800 bg-[#1a1a1a] rounded-2xl flex flex-col items-center"
          >
            <div className="w-14 h-14 bg-[#242424] rounded-2xl border border-gray-800 flex items-center justify-center mb-5">
              <Trophy size={24} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mb-2">
              No {activeTab.toLowerCase()} contests
            </h3>
            <p className="text-gray-500 max-w-xs text-sm leading-relaxed">
              {activeTab === "UPCOMING"
                ? "Something's being cooked up. Check back soon."
                : "Nothing here matching this status right now."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {filtered.map((contest, index) => (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={`/contests/${contest.id}`}
                  className="group flex flex-col h-full bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 hover:border-gray-700 hover:bg-[#1e1e1e] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h2 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-2 tracking-tight">
                      {contest.title}
                    </h2>

                    {contest.status === "ACTIVE" && (
                      <span className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                        <Activity size={11} className="animate-pulse" /> Live
                      </span>
                    )}
                    {contest.status === "UPCOMING" && (
                      <span className="shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                        Soon
                      </span>
                    )}
                    {contest.status === "ENDED" && (
                      <span className="shrink-0 bg-[#242424] text-gray-500 border border-gray-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle size={10} /> Ended
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                    {contest.description}
                  </p>

                  <div className="flex items-center justify-between pt-5 border-t border-gray-800/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-[#242424] border border-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                        <Calendar size={12} className="text-blue-500" />
                        {formatDate(contest.startTime)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#242424] border border-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                        <CodeSquare size={12} className="text-gray-500" />
                        {contest.problemCount}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#242424] border border-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                        <Users size={12} className="text-gray-500" />
                        {contest.participantCount}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-[#242424] border border-gray-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                      <ChevronRight size={15} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
