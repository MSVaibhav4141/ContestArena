import { prisma } from "@repo/db/prisma";
import ContestExplorer from "./components/ContestTabs";
import { getStatus } from "../helper/helperFunction";

export default async function ContestsPage() {
  const contests = await prisma.contest.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      _count: { select: { problems: true } }, 
    },
  });

  const formattedContests = contests.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: getStatus(c.startTime, c.endTime), 
    participantCount: c.participant, 
    problemCount: c._count.problems,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-300 font-sans pb-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
        <div className="pt-8 border-b border-gray-800 pb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            The Arena
          </h1>
          <p className="text-gray-400 mt-3 text-lg max-w-2xl leading-relaxed">
            Test your limits. Register for upcoming coding battles, compete in live events, and climb the global leaderboard.
          </p>
        </div>
        <ContestExplorer initialContests={formattedContests} />
      </div>
    </div>
  );
}