import { prisma } from "@repo/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
): Promise<NextResponse> {
  const { id } = await params; 

  const testCases = await prisma.testCases.findMany({
    where:{
        submissionId:id
    },
    select:{
        identity: true,
        status:true
    }
  })

  const submissionStatus = await prisma.submission.findUnique({
    where:{
        id
    },
    select:{
        status:true
    }
  })
  return NextResponse.json({
    testCases,
    submissionStatus
  });
}