import { redis, pub } from "@repo/db/redis";

export async function updateLeaderboard(
  contestId: string,
  userId: string,
  solved: number,
  name:string
) {

  const timestamp = Date.now();

  const score = solved * 10000000000000 - timestamp;

  const leaderboardKey = `contest:${contestId}:leaderboard`;

  await redis.zadd(leaderboardKey, score, userId);

  const rank = await redis.zrevrank(leaderboardKey, userId);

  await pub.publish(
  `contest:${contestId}:updates`,
  JSON.stringify({
    type: "leaderboard_update",
    userId,
    solved,
    score,
    rank,
    name
  })
);

  return rank;
}