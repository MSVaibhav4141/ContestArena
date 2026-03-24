import { prisma } from "@repo/db/prisma";
import ContestManager from "./components/ContestManager";
import { getStatus } from "../../helper/helperFunction";

export default async function ContestsPage() {
  const contests = await prisma.contest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      problems: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            }
          }
        }
      }
    }
  });

  const formattedContests = contests.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: getStatus(c.startTime, c.endTime),
    
    startTime: c.startTime.toISOString(), 
    endTime: c.endTime.toISOString(),
    
    participants: c.participant || 0, 
    
    problems: c.problems, 
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

export const dynamic = 'force-dynamic'; 