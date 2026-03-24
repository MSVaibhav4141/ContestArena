-- DropForeignKey
ALTER TABLE "Problem" DROP CONSTRAINT "Problem_constestId_fkey";

-- CreateTable
CREATE TABLE "ContestToProblem" (
    "problemId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "problemPoint" INTEGER NOT NULL,

    CONSTRAINT "ContestToProblem_pkey" PRIMARY KEY ("problemId","contestId")
);

-- AddForeignKey
ALTER TABLE "ContestToProblem" ADD CONSTRAINT "ContestToProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestToProblem" ADD CONSTRAINT "ContestToProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
