-- DropForeignKey
ALTER TABLE "UserSubmission" DROP CONSTRAINT "UserSubmission_contestId_fkey";

-- AlterTable
ALTER TABLE "UserSubmission" ALTER COLUMN "contestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserSubmission" ADD CONSTRAINT "UserSubmission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
