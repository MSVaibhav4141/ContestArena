import { prisma } from "@repo/db/prisma";
import ProblemManager from "./components/ProblemManager";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // 1. Setup Pagination Math
  const currentPage = Number(searchParams?.page) || 1;
  const PAGE_SIZE = 10;
  const skip = (currentPage - 1) * PAGE_SIZE;

  // 2. Fetch Data & Total Count Concurrently
  const [problems, totalProblems] = await Promise.all([
    prisma.problem.findMany({
      skip: skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
      }
    }),
    prisma.problem.count(), // Total count to calculate max pages
  ]);

  const totalPages = Math.ceil(totalProblems / PAGE_SIZE);

  // 3. Format for the Client
  const formattedProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    author: p.creator?.name || 'Admin',
    status: p.isApproved, // 'ACCEPTED', 'PENDING', 'REJECTED'
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Problem Library</h1>
        <p className="text-gray-500 mt-1">
          Manage all coding challenges, view details, and organize the database.
        </p>
      </div>

      <ProblemManager 
        initialData={formattedProblems} 
        currentPage={currentPage} 
        totalPages={totalPages} 
        totalCount={totalProblems}
      />
    </div>
  );
}