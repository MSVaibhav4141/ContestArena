import { redis } from "@repo/db/redis";
import LeaderboardClient from "./component/LeaderBoardClient";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const leaderboardKey = `contest:${id}:leaderboard`;

  const result = await redis.zrevrange(
    leaderboardKey,
    0,
    50,
    "WITHSCORES"
  );

  const userIds = result.filter((_,index) => index % 2 === 0)
  console.log(userIds,'userods')

  let names;
  const users: { userId: string; score: number, name:string }[] = [];
  if(userIds.length){
    
       names = await redis.hmget(
        `contest:${id}:users`,
        ...userIds
      )
      for (let i = 0; i < result.length; i += 2) {
    
        users.push({
          userId: result[i] ?? "",
          score: Number(result[i + 1]),
          name:names[i]??"Anonymous"
        });
    
      }
  }


 return (
  <div className="min-h-screen bg-[#0f0f0f] text-white p-8 space-y-10">

    <div className="flex items-center gap-4 mb-6">
      <div className="p-4 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
        <Trophy size={24} />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Live Leaderboard
        </h1>
        <p className="text-gray-400 text-sm">
          Real-time contest rankings
        </p>
      </div>
    </div>
    
        <div className="bg-[#171717] border border-gray-800 rounded-2xl shadow-lg overflow-hidden ">
      <LeaderboardClient
        initialUsers={users}
        contestId={id}
      />
    </div>
  </div>
);
}