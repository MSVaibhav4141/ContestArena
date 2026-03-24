"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type User = {
  userId: string;
  score: number;
  name:string;
};

const SOLVED_MULTIPLIER = 10000000000000;

export default function LeaderboardClient({
  initialUsers,
  contestId,
}: {
  initialUsers: User[];
  contestId: string;
}) {

  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {

    const ws = new WebSocket(
      `ws://localhost:8083?contestId=${contestId}`
    );

    ws.onmessage = (event) => {

      const update = JSON.parse(event.data);

      if (update.type !== "leaderboard_update") return;

      setUsers((prev) => {

        const updated = [...prev];

        const index = updated.findIndex(
          (u) => u.userId === update.userId
        );

        if (index !== -1) {
          updated[index]!.score = update.score;
        } else {
          updated.push({
            userId: update.userId,
            score: update.score,
            name:update.name
          });
        }

        updated.sort((a, b) => b.score - a.score);

        return updated;
      });

    };

    return () => ws.close();

  }, [contestId]);

  return (
    <>
    {users.length ? (
         <div className="w-full bg-[#171717] text-white">

    {/* Header */}
    <div className="grid grid-cols-3 px-8 py-4 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800 bg-[#111]">
      <div>Rank</div>
      <div>User</div>
      <div className="text-right">Solved</div>
    </div>

    <AnimatePresence>

      {users.map((user, index) => {

        const solved = Math.floor(user.score / SOLVED_MULTIPLIER);
        const avatar = user.name.slice(0, 2).toUpperCase();

        const top3 =
          index === 0
            ? "bg-yellow-500/10"
            : index === 1
            ? "bg-gray-400/10"
            : index === 2
            ? "bg-orange-500/10"
            : "";

        return (

          <motion.div
            key={user.userId}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={`grid grid-cols-3 items-center px-8 py-8 border-b border-gray-800 hover:bg-[#1f1f1f] transition ${top3}`}
          >

            {/* Rank */}
            <div className="flex items-center gap-3 font-semibold">

              {index === 0 && <span className="text-xl">🥇</span>}
              {index === 1 && <span className="text-xl">🥈</span>}
              {index === 2 && <span className="text-xl">🥉</span>}

              {index > 2 && (
                <span className="text-gray-400 font-medium">
                  #{index + 1}
                </span>
              )}

            </div>

            {/* User */}
            <div className="flex items-center gap-3">

              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-md">
                {avatar}
              </div>

              <div className="flex flex-col">

                <span className="text-gray-200 font-medium">
                  {user.name.slice(0, 10)}
                </span>

                <span className="text-xs text-gray-500">
                  ID-{user.userId.slice(0, 10)}
                  
                </span>
                <span className="text-xs text-gray-500">
                  participant
                </span>

              </div>

            </div>

            {/* Solved */}
            <div className="text-right">

              <span className="text-emerald-400 font-semibold text-lg">
                {solved}
              </span>

            </div>

          </motion.div>

        );

      })}

    </AnimatePresence>

  </div>
    ): (
    <div className="bg-[#171717] border border-gray-800 rounded-2xl flex items-center justify-center h-48">
  <div className="text-center space-y-3">
    <div className="text-4xl">🏆</div>
    <p className="text-gray-300 font-medium">
      Leaderboard is empty
    </p>
    <p className="text-gray-500 text-sm">
      Be the first to solve a problem and appear here.
    </p>
  </div>
</div>
)}
    </>
);
}