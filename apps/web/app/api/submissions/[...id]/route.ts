import { prisma } from "@repo/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import queue from '@repo/db/queue'

async function fetchFromS3(path:string){
   const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

  try {
    const command = new GetObjectCommand({
      Bucket: 'contest-arena-test-cases',
      Key: path
    });

    const response = await s3Client.send(command);
    // .transformToString() is the modern v3 way to handle the stream
    const data = await response.Body?.transformToString() ?? JSON.stringify([]);

    return JSON.parse(data);
  } catch (error: any) {
   console.error("S3 Helper Error:", error);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string[] }> } 
): Promise<NextResponse> {
  const { id } = await params; 
  console.log(id,'This is id ')

  if(id.length <= 1)return NextResponse.json({statusCode:404});

  const jobId = id[0]!
  const subId = id[1]!

   const myQueue = queue('setter-queue')  
   const job = await myQueue.getJob(jobId)

   const jobProgress = job?.progress;

   if(jobProgress === 100){
    let submissionStatus =  await prisma.submission.findFirst({
    where:{
      id: subId
    },
    select:{
        error:true,
        outputInline:true,
        s3URL:true,
        status:true
    }
  })
  
  if(!submissionStatus?.s3URL){
     return NextResponse.json({
    jobProgress,
    submissionStatus
  });
  }

  if(submissionStatus?.s3URL){
   const outputData = await fetchFromS3(submissionStatus.s3URL)
    
   console.log(outputData)
   submissionStatus = {
    ...submissionStatus,
    outputInline:JSON.parse(outputData)
   }
    return NextResponse.json({
    jobProgress,
    submissionStatus
  });
  }
}


return NextResponse.json({
  jobProgress,
  submissionStatus:{}
})
   }