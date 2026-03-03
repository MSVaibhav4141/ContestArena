"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, Activity, CheckCircle, CodeSquare, ChevronRight } from "lucide-react";

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
  // Local state for instant tab switching
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "UPCOMING" | "ENDED">("ACTIVE");
  console.log(initialContests)
  // Filter the pre-fetched data based on the active tab
  const filteredContests = initialContests.filter((c) => c.status === activeTab);

  // Helper to format the ISO date strings nicely
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-8">
      
      {/* --- CUSTOM TABS --- */}
      <div className="flex gap-2 bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800 w-fit shadow-lg">
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

      {/* --- CONTEST GRID --- */}
      {filteredContests.length === 0 ? (
        <div className="text-center py-24 border border-gray-800/60 bg-[#141414] rounded-3xl shadow-2xl flex flex-col items-center">
          <Trophy size={56} className="text-gray-700 mb-5" />
          <h3 className="text-2xl font-bold text-gray-300">No {activeTab.toLowerCase()} contests</h3>
          <p className="text-gray-500 mt-2 max-w-sm text-center">
            {activeTab === "UPCOMING" 
              ? "The admins are currently brewing up some new challenges. Check back soon!" 
              : "There are no contests currently matching this status."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          {filteredContests.map((contest) => (
            <Link 
              href={`/contests/${contest.id}`} 
              key={contest.id}
              className="group relative bg-[#1a1a1a] rounded-xl border-blue-200 p-5 hover:bg-blue-600/20 transition-colors duration-500 rounded-3xl bg-blue-600/10 hover:border-blue-400 hover:bg-[#1e1e1e] hover:-translate-y-1 transition-all duration-300 shadow-xl overflow-hidden"
            >
              {/* Subtle hover glow effect */}

              <div className="">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {contest.title}
                  </h2>
                  
                  {/* Status Badges */}
                  {contest.status === "ACTIVE" && (
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Activity size={12} className="animate-pulse"/> LIVE
                    </span>
                  )}
                  {contest.status === "UPCOMING" && (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-full">
                      UPCOMING
                    </span>
                  )}
                  {contest.status === "ENDED" && (
                    <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12}/> ENDED
                    </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mb-8 line-clamp-2 leading-relaxed">
                  {contest.description}
                </p>
                
                <div className="flex justify-between ">
                  <div className="flex items-center gap-5 text-sm text-gray-400 font-medium w-max gap-2">
                  <span className="flex items-center gap-2 bg-[#242424] px-3 py-1.5 rounded-lg border border-gray-800">
                    <Calendar size={14} className="text-blue-400"/> {formatDate(contest.startTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CodeSquare size={16} className="text-gray-600"/> {contest.problemCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={16} className="text-gray-600"/> {contest.participantCount}
                  </span>
                  </div>
                  <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                    <ChevronRight size={18} />
                </div>
                </div>
                
                {/* Enter Button Arrow */}
               
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for the pill-shaped tabs
function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
        isActive 
          ? "bg-[#2a2a2a] text-white shadow-md border border-gray-700" 
          : "text-gray-500 hover:text-gray-300 hover:bg-[#242424] border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}