/*
  Warnings:

  - Added the required column `totalCorrectTc` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalRejectedTc` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "totalCorrectTc" INTEGER NOT NULL,
ADD COLUMN     "totalRejectedTc" INTEGER NOT NULL;
