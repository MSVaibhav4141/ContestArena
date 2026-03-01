/*
  Warnings:

  - You are about to drop the column `isPublic` on the `Contest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('UPCOMING', 'ENDED', 'ACTIVE');

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "isPublic",
ADD COLUMN     "participant" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ContestStatus" NOT NULL DEFAULT 'UPCOMING';
