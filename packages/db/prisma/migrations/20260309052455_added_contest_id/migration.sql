/*
  Warnings:

  - A unique constraint covering the columns `[contestId]` on the table `UserSubmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contestId` to the `UserSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSubmission" ADD COLUMN     "contestId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSubmission_contestId_key" ON "UserSubmission"("contestId");

-- AddForeignKey
ALTER TABLE "UserSubmission" ADD CONSTRAINT "UserSubmission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
