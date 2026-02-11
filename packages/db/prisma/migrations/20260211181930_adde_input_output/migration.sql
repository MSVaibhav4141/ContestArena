/*
  Warnings:

  - Added the required column `inputs` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `output` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "inputs" JSONB NOT NULL,
ADD COLUMN     "output" JSONB NOT NULL;
