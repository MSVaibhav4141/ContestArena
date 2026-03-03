import { prisma } from "@repo/db/prisma";
import ContestExplorer from "./components/ContestTabs";

export default async function ContestsPage() {
  // 1. Fetch ALL contests on the server at once
  const contests = await prisma.contest.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      // Include the count of problems linked to each contest
      _count: { select: { problems: true } }, 
    },
  });

  // 2. Format the data to ensure it is perfectly serializable for the Client Component

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
  const formattedContests = contests.map((c)=> ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: getStatus(c.startTime, c.endTime), // 
    participantCount: c.participant, 
    problemCount: c._count.problems,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-300 font-sans pb-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="pt-8 border-b border-gray-800/50 pb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 tracking-tight">
            The Arena
          </h1>
          <p className="text-gray-400 mt-3 text-lg max-w-2xl">
            Test your limits. Register for upcoming coding battles, compete in live events, and climb the global leaderboard.
          </p>
        </div>

        {/* Pass data to the Client Component for instant tab switching */}
        <ContestExplorer initialContests={formattedContests} />
        
      </div>
    </div>
  );
}