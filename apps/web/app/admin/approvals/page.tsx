export const dynamic = 'force-dynamic';

import { prisma } from "@repo/db/prisma";
import ReviewManager from "../approvals/components/ReviewManager";

// Server Component
export default async function ApprovalsPage() {
  // 1. Fetch data securely on the server
  const pendingProblems = await prisma.problem.findMany({
    where: { isApproved: 'PENDING' },
    include: {
      creator: { select: { name: true } },
      submission:{select: {outputInline: true}}
      // Include your test cases relation here
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format data if needed before passing to client
  const formattedData = pendingProblems.map(p => ({
    id: p.id,
    title: p.title,
    author: p.creator?.name || 'Unknown',
    difficulty: p.difficulty,
    submittedAt: p.createdAt.toLocaleDateString(),
    testCases: p.submission.map(i => i.outputInline) // Adjust based on your schema
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">Review community-submitted problems before publishing.</p>
      </div>

      {/* 2. Pass the raw data to your interactive Client Component */}
      <ReviewManager initialData={formattedData} />
    </div>
  );
}
