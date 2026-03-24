/*
  Warnings:

  - A unique constraint covering the columns `[problemId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Submission_problemId_key" ON "Submission"("problemId");
