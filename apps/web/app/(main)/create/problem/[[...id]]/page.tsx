import { redirect, notFound } from "next/navigation"; // FIX: Added notFound for better Next.js 404 handling
import FormShell from "../../../../../components/Problem/ProblemForm";
import { getProblemById, getSubmissionById, getUserSubmission } from "../../../../actions/action";
import { auth } from "../../../../../auth";
import { SubmissionData } from "@repo/types";
import ProblemWorkspace from "../../../../../components/Problem/ProblemUser";
import { prisma } from "@repo/db/prisma";
import { ChevronLeft, ShieldAlert, AlertTriangle } from "lucide-react"; // FIX: Added AlertTriangle for the banner
import Link from "next/link";

export default async function CreateProblemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string[] | undefined }>;
  searchParams: Promise<{ contestId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect("/login"); 
  }

  const userId = session.user.id;
  const contestId = resolvedSearch.contestId;
  const problemId = resolvedParams.id?.length ? resolvedParams.id[0] : undefined;
  const serverNow = new Date().toISOString();

  let contestMode = false;
  let endTime: string | undefined;
  let isRegistered = true; 

  if (contestId) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        registrations: {
          where: { userId },
        },
      },
    });

    if (!contest) {
      notFound();
    }

    if (new Date() < contest.startTime) {
      return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-12 text-center max-w-md shadow-2xl">
            <div className="bg-yellow-500/10 p-5 rounded-full mb-6 w-max mx-auto">
              <ShieldAlert size={48} className="text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">This problem is encrypted and locked until the contest officially begins.</p>
            <Link href={`/contests/${contestId}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
              Return to Arena
            </Link>
          </div>
        </div>
      );
    }

    contestMode = true;
    endTime = contest.endTime.toISOString();
    isRegistered = contest.registrations.length > 0;
  }

  const problemData = problemId ? await getProblemById({ id: problemId }) : undefined ;

  if (problemId && !problemData) {
    notFound(); 
  }

  const isCreator = userId === problemData?.createdBy || (!problemData && !problemId);

  const submissionData = isCreator
    ? await getSubmissionById({ id: problemData?.id, userId })
    : { code: "cpp", language: "" };

  const userSubmissionData = (problemData && !isCreator)
    ? await getUserSubmission({ problemId: problemData.id, userId, contestId })
    : [];

  if (isCreator) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <FormShell problem={problemData} submissionData={submissionData} />
      </div>
    );
  }

  // 6. Render: Solver / Contestant View
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      
      {contestMode && !isRegistered && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 shrink-0 flex items-center justify-center gap-2">
          <AlertTriangle size={18} className="text-yellow-500" />
          <p className="text-sm font-medium text-yellow-500">
            <strong>Spectator Mode:</strong> You are not registered for this contest. You may view the problem, but submissions are disabled.
          </p>
        </div>
      )}

      <header className="bg-[#1a1a1a] border-b border-gray-800 h-14 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          {contestMode ? (
            <Link href={`/contests/${contestId}`} className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors">
              <ChevronLeft size={16} /> Back to Arena
            </Link>
          ) : (
            <Link href="/problems" className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm font-bold transition-colors">
              <ChevronLeft size={16} /> Problem List
            </Link>
          )}
          
          <div className="h-4 w-px bg-gray-700"></div>
          <h1 className="text-white font-bold">{problemData?.title}</h1>

          {contestMode && (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              Contest Mode
            </span>
          )}
        </div>
      </header>

      {problemData && (
        <div className="flex-1 overflow-hidden">
          <ProblemWorkspace
            problem={problemData}
            submission={userSubmissionData}
            serverTimeOnLoad={serverNow}
            contestEndTime={endTime}
            contestId={contestId}
            isRegistered={isRegistered} 
          />
        </div>
      )}
    </div>
  );
}