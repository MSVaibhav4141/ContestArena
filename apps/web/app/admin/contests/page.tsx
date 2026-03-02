import { prisma } from "@repo/db/prisma";
import ContestManager from "./components/ContestManager";

export default async function ContestsPage() {
  
  
  const contests = await prisma.contest.findMany()
  // 2. Format dates and data for the Client Component
  const formattedContests = contests.map((c:any) => ({
    id: c.id,
    title: c.title,
    status: c.status, // e.g., 'UPCOMING', 'ACTIVE', 'ENDED'
    startTime: c.startTime.toLocaleString(),
    endTime: c.endTime.toLocaleString(),
    participants: c.participant,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Contest Management</h1>
        <p className="text-gray-500 mt-1">Create, schedule, and monitor coding competitions.</p>
      </div>

      <ContestManager initialData={formattedContests} />
    </div>
  );
}