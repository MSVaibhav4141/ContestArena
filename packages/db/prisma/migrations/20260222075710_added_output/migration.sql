-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "outputInline" JSONB,
ADD COLUMN     "s3URL" TEXT;
