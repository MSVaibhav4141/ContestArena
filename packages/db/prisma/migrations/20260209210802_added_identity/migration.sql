/*
  Warnings:

  - Added the required column `identity` to the `TestCases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TestCases" ADD COLUMN     "identity" TEXT NOT NULL;
