-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "constestId" TEXT;

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_constestId_fkey" FOREIGN KEY ("constestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
