/*
  Warnings:

  - You are about to drop the column `fullCode` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `testCase` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "testCase" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "fullCode";
