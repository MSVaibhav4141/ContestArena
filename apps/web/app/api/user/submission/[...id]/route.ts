import { prisma } from "@repo/db/prisma";
import queue from "@repo/db/queue";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request:NextRequest,
    { params }: { params: Promise<{ id: string[] }> }
){

    const {id} = await params;
    
    const submissionId = id[0];
    const jobId = id[1];
    if(!submissionId || !jobId){
        return NextResponse.json({
            msg:"No Id recived",
        })    
    }

    const userQueue = queue('user-queue');

    const job = await userQueue.getJob(jobId)
    const jobProgress = job?.progress;

    if(jobProgress === 100){
        const submission = await prisma.userSubmission.findUnique({
            where:{
                id: submissionId,
                status:{
                    not:"PENDING"
                }
            },
            select:{
                outputInline:true,
                code:true,
                totalCorrectTc:true,
                totalRejectedTc:true
            }
        })

        return NextResponse.json({
            submission,
            jobProgress
        })
    }else{
        return NextResponse.json({
            jobProgress
        })


    }


}