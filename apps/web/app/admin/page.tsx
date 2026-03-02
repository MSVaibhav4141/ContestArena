import { prisma } from "@repo/db/prisma";
import { Users, Trophy, FileCode2, CheckCircle, Plus, UserRoundCheck } from 'lucide-react';
import Link from "next/link";

export default async function AdminDashboardPage() {
  // 1. Fetch all dashboard metrics concurrently for max performance
  const [totalUsers, pendingProblems, totalSubmissions,activeContests, userSubmission] = await Promise.all([
    prisma.user.count(),
    prisma.problem.count({ where: { isApproved: 'PENDING' } }),
    prisma.submission.count(),
    prisma.contest.count({ where: { status: 'UPCOMING' } }),
    prisma.userSubmission.count()
    // Add your Contest count here if you have a Contest model
  ]);

  // Mocking active contests for the UI until your Contest model is ready

  const stats = [
    { 
      label: 'Total Users', 
      value: totalUsers.toLocaleString(), 
      increment: 'Platform wide', 
      icon: Users, 
      color: 'text-blue-500 bg-blue-500/10' 
    },
    { 
      label: 'Active Contests', 
      value: activeContests.toString(), 
      increment: 'Ongoing right now', 
      icon: Trophy, 
      color: 'text-yellow-500 bg-yellow-500/10' 
    },
    { 
      label: 'Pending Approvals', 
      value: pendingProblems.toString(), 
      increment: 'Awaiting your review', 
      icon: FileCode2, 
      color: 'text-purple-500 bg-purple-500/10' 
    },
    { 
      label: 'Total Submissions', 
      value: totalSubmissions.toLocaleString(), 
      increment: 'All-time execution runs', 
      icon: CheckCircle, 
      color: 'text-emerald-500 bg-emerald-500/10' 
    },
    { 
      label: 'Total Submissions By User', 
      value: userSubmission.toLocaleString(), 
      increment: 'All-time execution runs', 
      icon: UserRoundCheck, 
      color: 'text-white bg-emerald-500/10' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Real-time metrics for ContestArena.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link 
            href="/admin/contests"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            <Plus size={18} /> Create Contest
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium mb-1">{stat.label}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4 font-medium">{stat.increment}</div>
          </div>
        ))}
      </div>

      {/* --- ADD MORE SECTIONS HERE LATER --- */}
      {/* Example: A "Recent Platform Activity" feed or "Live Contest Leaderboard" */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 min-h-[300px]">
           <h3 className="text-lg font-bold text-white mb-4">Platform Traffic (Coming Soon)</h3>
           <div className="flex items-center justify-center h-48 text-gray-600 italic">
               Analytics chart will go here
           </div>
        </div>
        <div className="col-span-1 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 min-h-[300px]">
           <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
           <ul className="space-y-3 text-sm">
             <li>
               <Link href="/admin/approvals" className="text-gray-400 hover:text-blue-400 transition-colors">Review {pendingProblems} pending problems &rarr;</Link>
             </li>
             {/* Add more system links here */}
           </ul>
        </div>
      </div>

    </div>
  );
}