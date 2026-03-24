"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, Activity, CheckCircle, CodeSquare, ChevronRight } from "lucide-react";
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

  const filteredContests = initialContests.filter((c) => c.status === activeTab);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-8">
      
      <div className="flex gap-2 bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800 w-fit shadow-lg z-10">
        <TabButton 
          label="Live Now" 
          isActive={activeTab === "ACTIVE"} 
          onClick={() => setActiveTab("ACTIVE")} 
        />
        <TabButton 
          label="Upcoming" 
          isActive={activeTab === "UPCOMING"} 
          onClick={() => setActiveTab("UPCOMING")} 
        />
        <TabButton 
          label="Past Contests" 
          isActive={activeTab === "ENDED"} 
          onClick={() => setActiveTab("ENDED")} 
        />
      </div>

      <AnimatePresence mode="wait">
        {filteredContests.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center py-24 border border-gray-800 bg-[#141414] rounded-3xl shadow-2xl flex flex-col items-center"
          >
            <Trophy size={56} className="text-gray-700 mb-5" />
            <h3 className="text-2xl font-bold text-gray-300">No {activeTab.toLowerCase()} contests</h3>
            <p className="text-gray-500 mt-2 max-w-sm text-center leading-relaxed">
              {activeTab === "UPCOMING" 
                ? "The admins are currently brewing up some new challenges. Check back soon!" 
                : "There are no contests currently matching this status."}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence>
              {filteredContests.map((contest, index) => (
                <motion.div
                  key={contest.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link 
                    href={`/contests/${contest.id}`} 
                    className="group flex flex-col h-full bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 hover:border-gray-700 hover:bg-[#1e1e1e] transition-all duration-300 shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {contest.title}
                      </h2>
                      
                      {contest.status === "ACTIVE" && (
                        <span className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <Activity size={14} className="animate-pulse"/> LIVE
                        </span>
                      )}
                      {contest.status === "UPCOMING" && (
                        <span className="shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1.5 rounded-full">
                          UPCOMING
                        </span>
                      )}
                      {contest.status === "ENDED" && (
                        <span className="shrink-0 bg-gray-800 text-gray-400 border border-gray-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <CheckCircle size={14}/> ENDED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-8 line-clamp-2 leading-relaxed flex-1">
                      {contest.description}
                    </p>
                    
                    <div className="flex justify-between items-end mt-auto pt-6 border-t border-gray-800/50">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 font-medium">
                        <span className="flex items-center gap-2 bg-[#242424] px-3 py-1.5 rounded-lg border border-gray-800/80">
                          <Calendar size={14} className="text-blue-400"/> {formatDate(contest.startTime)}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#242424] px-3 py-1.5 rounded-lg border border-gray-800/80">
                          <CodeSquare size={14} className="text-gray-500"/> {contest.problemCount}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#242424] px-3 py-1.5 rounded-lg border border-gray-800/80">
                          <Users size={14} className="text-gray-500"/> {contest.participantCount}
                        </span>
                      </div>
                      <div className="shrink-0 bg-gray-800 text-gray-400 group-hover:bg-blue-600 group-hover:text-white p-2.5 rounded-full transition-colors duration-300">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-2.5 rounded-lg font-bold text-sm transition-colors duration-200 ${
        isActive ? "text-white" : "text-gray-500 hover:text-gray-300 hover:bg-[#242424]"
      }`}
    >
      {isActive && (
        <motion.div 
          layoutId="active-tab-indicator"
          className="absolute inset-0 bg-[#2a2a2a] rounded-lg border border-gray-700 shadow-md"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}