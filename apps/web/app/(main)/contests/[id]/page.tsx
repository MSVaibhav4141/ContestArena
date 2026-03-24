import { prisma } from "@repo/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, ShieldAlert, ChevronRight, BarChart3, Lock, Activity } from "lucide-react";
import CountdownTimer from "./components/CountdownTimer";
import { getStatus } from "../../../helper/helperFunction";
import RegisterButton from "./components/RegisterButton";
import { auth } from "../../../../auth";

export default async function ContestView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!id) return notFound();

  const userId = session?.user?.id || "";

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      problems: {
        where: { contestId: id },
        include: {
          problem: {
            select: { id: true, title: true, difficulty: true },
          },
        },
      },
      registrations: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!contest) return notFound();

  const isUpcoming = getStatus(contest.startTime, contest.endTime) === "UPCOMING";
  const isActive = getStatus(contest.startTime, contest.endTime) === "ACTIVE";
  const hasRegistered = contest.registrations.length > 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-300 pb-20" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <div className="max-w-5xl mx-auto p-8">

        <div className="flex items-center text-sm text-gray-600 font-medium mb-8">
          <Link href="/contests" className="hover:text-gray-300 transition-colors">
            Contests
          </Link>
          <ChevronRight size={15} className="mx-2" />
          <span className="text-gray-400">{contest.title}</span>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 md:p-10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/8 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : isUpcoming
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-[#242424] text-gray-500 border-gray-700"
                  }`}
                >
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5">
                      <Activity size={10} className="animate-pulse" /> Live
                    </span>
                  )}
                  {!isActive && contest.status}
                </span>

                {isUpcoming && <CountdownTimer targetDate={contest.startTime.toISOString()} label="Starts in" />}
                {isActive && <CountdownTimer targetDate={contest.endTime.toISOString()} label="Ends in" />}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                {contest.title}
              </h1>
              <p className="text-gray-400 max-w-2xl text-base leading-relaxed">
                {contest.description}
              </p>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-3 shrink-0 w-full md:w-auto">
              {isUpcoming ? (
                <RegisterButton contestId={contest.id} userId={userId} isRegistered={hasRegistered} />
              ) : isActive ? (
                hasRegistered ? (
                  <Link
                    href={`/contests/${contest.id}/arena`}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5"
                  >
                    Enter Arena <ChevronRight size={15} />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#242424] text-gray-600 border border-gray-800 text-sm font-bold cursor-not-allowed"
                  >
                    <Lock size={14} /> Registration Closed
                  </button>
                )
              ) : (
                <Link
                  href={`/contests/${contest.id}/leaderboard`}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-bold transition-all"
                >
                  <BarChart3 size={15} /> Final Results
                </Link>
              )}

              {(isActive || isUpcoming) && (
                <Link
                  href={`/contests/${contest.id}/leaderboard`}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-sm font-semibold transition-all"
                >
                  {isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Live Leaderboard
                    </>
                  ) : (
                    <>
                      <BarChart3 size={15} /> Leaderboard
                    </>
                  )}
                </Link>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-medium mt-1">
                <Users size={13} /> {contest.participant} registered
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
              <Trophy size={16} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Challenge Dashboard</h2>
          </div>

          <div className="space-y-3">
            {isUpcoming ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <ShieldAlert size={28} className="text-yellow-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Arena is Locked</h3>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  The problem set is sealed and will reveal itself automatically when the countdown ends.
                </p>
              </div>
            ) : (
              contest.problems.map((linker, index) => (
                <Link
                  key={linker.problemId}
                  href={
                    isActive
                      ? `/create/problem/${linker.problem.id}?contestId=${linker.contestId}`
                      : `/create/problem/${linker.problem.id}`
                  }
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-[#1e1e1e] transition-all duration-300 group hover:-translate-y-0.5 gap-4"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-2xl font-black text-gray-800 group-hover:text-gray-600 transition-colors w-7 text-center font-mono shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors mb-2 tracking-tight">
                        {linker.problem.title}
                      </h3>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded border uppercase tracking-wider ${
                          linker.problem.difficulty === "EASY"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : linker.problem.difficulty === "MEDIUM"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {linker.problem.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 sm:justify-end border-t border-gray-800/50 sm:border-none pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-left sm:text-right flex-1 sm:flex-none">
                      <div className="text-xl font-black text-white">{linker.problemPoint}</div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Points</div>
                    </div>
                    <div className="w-9 h-9 bg-[#242424] border border-gray-800 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
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
