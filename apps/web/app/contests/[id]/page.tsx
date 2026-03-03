import { prisma } from "@repo/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, ShieldAlert, ChevronRight, BarChart3, Lock } from "lucide-react";
import CountdownTimer from "./components/CountdownTimer";
import { title } from "process";

export default async function ContestView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) return notFound();

  // 1. Fetch the data strictly on the server
  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      // Reaching through your explicit join table to get the problems
      problems: {
        where:{
            contestId:id
        },
        include: { problem: {
            select:{
                id:true,
                title:true,
                difficulty:true
            }
        },
         }
      },
    },
  });

  console.log(contest)
  if (!contest) return notFound();

  const getStatus = (
  startTime: Date,
  endTime: Date
): "UPCOMING" | "ACTIVE" | "ENDED" => {

  const currentTime = new Date();

  if (currentTime >= endTime) {
    return "ENDED";
  }

  if (currentTime < startTime) {
    return "UPCOMING";
  }

  return "ACTIVE";
};
  const isUpcoming = getStatus(contest.startTime, contest.endTime) === 'UPCOMING';
  const isActive = getStatus(contest.startTime, contest.endTime) === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-300 font-sans pb-20">
      <div className="max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 font-medium mb-8">
          <Link href="/contests" className="hover:text-white transition-colors">Contests</Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-gray-300">{contest.title}</span>
        </div>

        {/* --- HERO BANNER --- */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  isUpcoming ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  "bg-gray-800 text-gray-400 border-gray-700"
                }`}>
                  {contest.status}
                </span>
                
                {/* Mount the Client Island Timer */}
                {isUpcoming && <CountdownTimer targetDate={contest.startTime.toISOString()} label="Starts in" />}
                {isActive && <CountdownTimer targetDate={contest.endTime.toISOString()} label="Ends in" />}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                {contest.title}
              </h1>
              <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
                {contest.description}
              </p>
            </div>
            
            {/* Registration CTA */}
            <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
              {isUpcoming ? (
                <button className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5">
                  Register for Contest
                </button>
              ) : isActive ? (
                 <button className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                   Enter Arena
                 </button>
              ) : (
                <Link href={`/contests/${contest.id}/leaderboard`} className="bg-[#242424] text-white border border-gray-700 px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <BarChart3 size={18} /> View Final Results
                </Link>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Users size={16} /> {contest.participant} Registered
              </div>
            </div>
          </div>
        </div>

        {/* --- PROBLEM DASHBOARD --- */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24}/> Challenge Dashboard
          </h2>

          <div className="space-y-4">
            {isUpcoming ? (
              // SECURITY: Hide problems if the contest hasn't started!
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-16 text-center flex flex-col items-center shadow-lg">
                <div className="bg-yellow-500/10 p-5 rounded-full mb-6">
                  <ShieldAlert size={48} className="text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Arena is Locked</h3>
                <p className="text-gray-400 text-lg">
                  The problem set is securely encrypted and will automatically reveal when the countdown ends.
                </p>
              </div>
            ) : (
              // REVEALED: Show problems if Active or Ended
              contest.problems.map((linker, index) => (
                <Link 
                  href={`/create/problem/${linker.problem.id}?contestId=${linker.contestId}`} 
                  key={linker.problemId}
                  className="flex items-center justify-between bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-blue-500/50 hover:bg-[#1e1e1e] transition-all group shadow-md"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-3xl font-black text-gray-700 group-hover:text-blue-500/30 transition-colors w-8 text-center">
                      {String.fromCharCode(65 + index)} {/* Converts 0,1,2 to A, B, C */}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors mb-2">
                        {linker.problem.title}
                      </h3>
                      <div className="flex gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${
                           linker.problem.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                           linker.problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                           'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {linker.problem.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-6">
                    <div className="hidden md:block text-right">
                      <div className="text-xl font-black text-white">{linker.problemPoint}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Points</div>
                    </div>
                    <div className="bg-blue-600/10 text-blue-500 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}