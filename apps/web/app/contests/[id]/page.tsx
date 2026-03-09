import { prisma } from "@repo/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, ShieldAlert, ChevronRight, BarChart3, Lock } from "lucide-react";
import CountdownTimer from "./components/CountdownTimer";
import { getStatus } from "../../helper/helperFunction";
import RegisterButton from "./components/RegisterButton";
import { auth } from "../../../auth";

export default async function ContestView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!id) return notFound();
  
  // FIX 1: Provide a fallback so it's always a string, never undefined.
  const userId = session?.user?.id || "";

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      problems: {
        where: {
          contestId: id
        },
        include: { 
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          }
        }
      },
      registrations: {
        where: { userId: userId },
        select: { id: true }
      }
    },
  });

  if (!contest) return notFound();

  const isUpcoming = getStatus(contest.startTime, contest.endTime) === 'UPCOMING';
  const isActive = getStatus(contest.startTime, contest.endTime) === 'ACTIVE';
  
  const hasRegistered = contest.registrations.length > 0;

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
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden shadow-2xl rounded-xl">
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
            {/* Registration CTA Area */}
<div className="flex flex-col items-center md:items-end gap-3 shrink-0">
  
  {isUpcoming ? (
    <RegisterButton 
       contestId={contest.id} 
       userId={userId} 
       isRegistered={hasRegistered} 
    />
  ) : isActive ? (
     hasRegistered ? (
       <button className="bg-emerald-600 text-white h-12 px-8 py-3.5 rounded-md font-bold hover:bg-emerald-700 transition-all shadow-lg">
         Enter Arena
       </button>
     ) : (
       // STRICT MODE: They are late. They cannot register.
       <button disabled className="bg-gray-800 h-12 text-gray-500 border  border-gray-700 px-8 py-3.5 rounded-md font-bold cursor-not-allowed flex items-center gap-2">
        
         <Lock size={18} /> Registration Closed
       </button>
     )
  ) : (
    <Link href={`/contests/${contest.id}/leaderboard`} className="bg-[#242424]  h-12 rounded-md text-white border border-gray-700 px-8 py-3.5  font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
      <BarChart3 size={18} /> View Final Results
    </Link>
  )}

  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-2">
    <Users size={16} /> {contest.participant} Registered
  </div>
</div>
          </div>
        </div>

        {/* --- PROBLEM DASHBOARD --- */}
          <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <Trophy className="text-yellow-500" size={20}/>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Challenge Dashboard</h2>
          </div>

          <div className="space-y-4">
            {isUpcoming ? (
              <div className="bg-[#141414] border border-gray-800 rounded-3xl p-16 text-center flex flex-col items-center shadow-2xl">
                <div className="bg-yellow-500/10 p-5 rounded-full mb-6 ring-1 ring-yellow-500/20">
                  <ShieldAlert size={48} className="text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Arena is Locked</h3>
                <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                  The problem set is securely encrypted and will automatically reveal when the countdown ends.
                </p>
              </div>
            ) : (
              contest.problems.map((linker, index) => (
                <Link 
                  href={ isActive ? `/create/problem/${linker.problem.id}?contestId=${linker.contestId}` : `/create/problem/${linker.problem.id}`} 
                  key={linker.problemId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 hover:bg-[#1e1e1e] transition-all duration-300 group shadow-md hover:shadow-xl hover:-translate-y-0.5 gap-4"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-3xl font-black text-gray-800 group-hover:text-gray-600 transition-colors w-8 text-center font-mono">
                      {String.fromCharCode(65 + index)} 
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-200 group-hover:text-white transition-colors mb-2 tracking-tight">
                        {linker.problem.title}
                      </h3>
                      <div className="flex gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${
                           linker.problem.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                           linker.problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                           'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {linker.problem.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:justify-end border-t border-gray-800/50 sm:border-none pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-left sm:text-right flex-1 sm:flex-none">
                      <div className="text-xl font-black text-white">{linker.problemPoint}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Points</div>
                    </div>
                    <div className="bg-[#242424] text-gray-400 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
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