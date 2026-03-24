-- DropForeignKey
ALTER TABLE "TestCases" DROP CONSTRAINT "TestCases_submissionId_fkey";

-- CreateTable
CREATE TABLE "UserSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,
    "totalCorrectTc" INTEGER NOT NULL DEFAULT 0,
    "totalRejectedTc" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memoryTaken" INTEGER DEFAULT 0,
    "timeTaken" DOUBLE PRECISION DEFAULT 0,
    "code" TEXT NOT NULL,

    CONSTRAINT "UserSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSubmission" ADD CONSTRAINT "UserSubmission_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubmission" ADD CONSTRAINT "UserSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubmission" ADD CONSTRAINT "UserSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "UserSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
