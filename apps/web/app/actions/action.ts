// app/problems/new/actions.ts
"use server";
import { prisma } from "@repo/db/prisma";
import queue from "@repo/db/queue"
import {
  generateBoilerPlate,
  generateFullCode,
} from "@repo/generateboilerplate";
import { auth } from "../../auth";
import axios from "axios";
import { revalidatePath } from "next/cache";
import {
  ContestPayload,
  InputParam,
  OutputParams,
  ProblemData,
  ProblemSubmission,
  Structure,
  StructureParams,
  TestCase,
  UpdateContestPayload,
  updatedContest,
} from "@repo/types";
import { createSlug } from "./helpers/helper";
import { redis } from "@repo/db/redis";


export async function createProblemAction(formData: Structure) {
  let problemId: string | null = formData.problemId;

  const session = await auth();
  const user = session?.user.id;
  if (!user) {
    return {
      msg: "Unauthorized",
    };
  }

  const { name, description, inputs, output } = formData;

  const startCode = generateBoilerPlate("", formData);

  if (!startCode) {
    return false;
  }
  const slug = createSlug(name);
  const db = await prisma.$transaction(async (t) => {
    const fileName = `problems/${slug}/test-cases.json`;
    if (problemId) {
      const problem = await t.problem.update({
        where: {
          id: problemId,
        },
        data: {
          title: name,
          description,
          slug,
          difficulty: "EASY",
          testCase: fileName,
          inputs,
          output: output.type
        },
      });

      await t.startCode.deleteMany({
        where: {
          problemId,
        },
      });

      await t.startCode.createMany({
        data: startCode.map((i) => {
          return {
            problemId: problem.id,
            ...i,
          };
        }),
      });
    } else {
      const problem = await t.problem.create({
        data: {
          title: name,
          description,
          slug,
          userId: user,
          createdBy: user,
          difficulty: "EASY",
          testCase: fileName,
          inputs,
          output: output.type
        },
      });
      problemId = problem.id;
      await t.startCode.createMany({
        data: startCode.map((i) => {
          return {
            problemId: problem.id,
            ...i,
          };
        }),
      });
    }
  },{
    maxWait: 5000, 
  timeout: 10000
  }
);

  // 🔥 Replace with DB save
  return { startCode, problemId };
}

export async function submitTestCases(code: any) {
  const {
    cases,
    params,
    problemName,
    outputType,
    codevaleCurrent,
    problemId,
    language,
    languageId,
    isPublic
  } = code;

  const session = await auth();

  const user = session?.user.id;
  if (!user) {
    return 
  }

  const slug = createSlug(problemName);

  const schema: Structure = {
    name: slug,
    inputs: params.map((i: any) => ({
      name: i.name,
      type: i.type,
    })) as StructureParams[],
    output: { type: outputType },
    description: "", // <--- fixthus
    problemId,
  };

  const fullCode = generateFullCode(
    codevaleCurrent.language.toUpperCase(),
    schema,
    codevaleCurrent.code,
    problemName,
  );
  console.log(problemId)

  const subId = await prisma.$transaction(async (txn) => {
    const {id} = await txn.submission.upsert({
      where:{
      problemId: problemId  
      },
      create:{
        userId: user,
        problemId,
        languageId:
          language === "cpp"
            ? 1
            : language === "rust"
              ? 2
              : language === "javascript"
                ? 3
                : 1,
        code: String(codevaleCurrent.code),
      },
      update: {
        status:'PENDING',
        languageId:
          language === "cpp"
            ? 1
            : language === "rust"
              ? 2
              : language === "javascript"
                ? 3
                : 1,
        code: String(codevaleCurrent.code),
      },
    });
    return id;
  },{
    maxWait: 5000, 
  timeout: 10000
  });

    const queuePayload = {
      problemId,
      cases,
      languageId,
      subId,
      fullCode
    }

    const myQueue = queue('setter-queue')
    myQueue.on('error', (e) => {
      console.log(e)
    })
    const job = await myQueue.add("judge-task", queuePayload);
    return {subId, jobId:job.id}
}

export async function submitProblem(props: ProblemSubmission) {
  const { submissionId } = props;

  if (!submissionId) {
    throw Error("No submission ID recived");
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
      status: "ACCEPTED",
    },
  });

  if (!submission) {
    throw Error("Submission still not accepted");
  }

  const problemId = submission.problemId;
}

export async function getProblemById({ id, userId }: { id?: string , userId?: string}): Promise<ProblemData | undefined> {

  if(!id){
    return undefined
  }
  const problem = await prisma.problem.findUnique({
    where: { 
      id,
      createdBy: userId 
    },
    select: {
      id: true,
      title: true,
      description: true,
      userId: true,
      createdBy: true,
      starterCodes:{
        select:{
          code:true,
          languageId:true
        }
      },
      inputs:true,
      output:true,
      difficulty:true
    },
  });

  if(problem){
    return {...problem, inputs: problem.inputs as InputParam[], output:problem.output as OutputParams}; 
  }else{
    return undefined
  }
}

export async function getSubmissionById({id, userId}: { id?: string , userId?: string}) {
  const data =  await prisma.submission.findFirst({
    where:{
      problemId:id
    },
    select:{
      languageId:true,
      code:true
    }
  })
  
  return {
    code: data?.code ??  "",
    language: data?.languageId === 1 ? 'cpp' : (data?.languageId === 2 ? 'rust' : 'javascript')
  }
}

export async function userSubmission({code, problemId, language, inputs, name, output, contestId}:{code:string, problemId:string,language:'cpp'|'javascript'|'rust', inputs: InputParam[], name:string,output:OutputParams,contestId?:string}){

  const session = await auth()
  const user = session?.user.id
  console.log(user)
  if(!user){
    return {
      status:401,
      msg:"Unauthorized, Kindly login"
    }
  }

  const submission = await prisma.userSubmission.create({
    data:{
        userId: user,
        problemId,
        languageId:language === "cpp"
            ? 1
            : language === "rust"
              ? 2
              : language === "javascript"
                ? 3
                : 1,
        code: String(code),
        contestId: contestId 
      },
  })

  const slug = createSlug(name);

  const schema: Structure = {
    name: slug,  // <-- not required
    inputs: inputs.map((i: any) => ({
      name: i.name,
      type: i.type,
    })) as StructureParams[],
    output: { type: output },
    description: "", // <--- fixthus
    problemId,
  };

  const languageName = language.toUpperCase() as  'CPP'|'JAVASCRIPT'|'RUST'
  const fullCode = generateFullCode(
    languageName,
    schema,
    code,
    name,
  );

  const queuePayload = {
    code:fullCode,
    problemId,
    language_id: language === 'cpp' ? 54 : (language === 'javascript'? 109 : 41), 
    submissionId:submission.id,
    contestId
  }
  const userQueue = queue('user-queue')
  userQueue.on('error', (e) => {
    console.log(e)
  })
  console.log(queuePayload)
  const job = await userQueue.add('user-submission',queuePayload)

  return {subId: submission.id, jobId: job.id}
}

export async function getUserSubmission({problemId, userId,contestId}:{problemId:string, userId:string, contestId?:string}){
  console.log(problemId, userId)
  const submission = await prisma.userSubmission.findMany({
    where:{
      problemId,
      userId,
      status:{
        not:"PENDING"
      },
      contestId:contestId ?? null
    },
    select:{
      totalCorrectTc:true,
      totalRejectedTc:true,
      outputInline:true,
      code:true
    }
  })

  return submission
}


export async function updateUserRole(userId: string, newRole: "ADMIN" | "USER") {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    
    revalidatePath("/admin/users"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to update role:", error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function createContest({title, description, startTime, endTime, isPublic, problems}:ContestPayload){

  const contest = await prisma.contest.create({
    data:{
      title,
      description,
      startTime:new Date(startTime),
      endTime: new Date(endTime),
      problems:{
        create: problems.map(i => {
          return {
            problemPoint: i.points,
            problemId: i.id
          }
        })
      }
    }
  })

  revalidatePath("/admin/contests"); 

  return {
    msg:"CONT CREATED",
    success:true
  }
}

export async function searchProblems(query: string,state:'PENDING'|'ACCEPTED'| 'REJECTED'): Promise<{id:string, title:string, difficulty:string}[]> {
  if (!query || query.length < 2) return [];

  try {
    const problems = await prisma.problem.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive', 
        },
        isApproved:state    
        },
      select: {
        id: true,
        title: true,
        difficulty: true,
      },
      take: 10, 
    });
    console.log(problems)
    return problems;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}


export async function deleteContest(contestId: string) {
  try {
    await prisma.$transaction([
      prisma.contestToProblem.deleteMany({
        where: { contestId: contestId }
      }),
      prisma.contest.delete({
        where: { id: contestId }
      })
    ]);

    revalidatePath("/admin/contests");
    return { success: true };

  } catch (error) {
    console.error("Failed to delete contest:", error);
    return { success: false, error: "Failed to delete contest. It may have active participants." };
  }
}

export async function updateContestStatus(contestId: string, newStatus: 'UPCOMING' | 'ACTIVE' | 'ENDED') {
  try {
    await prisma.contest.update({
      where: { id: contestId },
      data: { status: newStatus }
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Failed to update contest status." };
  }
}

export async function updatePorblemStatus({problemId , status}:{problemId:string, status: "PENDING"|"ACCEPTED"|"REJECTED"}){
  try{

    await prisma.problem.update({
      where:{
        id:problemId
      },
      data:{
        isApproved:status
      }
    })
    
    revalidatePath("/admin/approvals")
    return {succes:true}
  }catch(e){
    return { success: false, error: "Failed to update problem status." };
  }
}

export async function deleteProblem(problemId: string) {
  try {
    await prisma.$transaction([
      prisma.problem.deleteMany({ where: { id:problemId } }),
      prisma.problem.delete({ where: { id: problemId } })
    ]);

    revalidatePath("/admin/problems");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete problem:", error);
    return { success: false, error: "Failed to delete problem. It may be heavily linked." };
  }
}

export async function updateProblem(
  problemId: string, 
  data: { title: string; difficulty: string; status: string }
) {
  try {
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        title: data.title,
        difficulty: data.difficulty as any, 
        isApproved: data.status as any, 
      }
    });

    revalidatePath("/admin/problems");
    return { success: true };
  } catch (error) {
    console.error("Failed to update problem:", error);
    return { success: false, error: "Failed to save changes." };
  }
}

export async function registerForContest(contestId: string, userId: string) {
  try {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) return { success: false, error: "Contest not found." };

    const now = new Date();

    if (now > contest.endTime) {
      return { success: false, error: "Registration is closed. Contest has ended." };
    }

    const result = await prisma.$transaction([
      prisma.contestRegistration.create({
        data: { contestId, userId },
        include:{
          user:{
            select:{
              name:true
            }
          }
        }
      }),
      prisma.contest.update({
        where: { id: contestId },
        data: { participant: { increment: 1 } },
      })
    ]);
    const username = result[0].user.name
    const userKey = `contest:${contestId}:users`;
    await redis.hset(userKey, userId,username )
    revalidatePath(`/contests/${contestId}`);
    return { success: true };

  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "You are already registered." };
    }
    return { success: false, error: "Failed to register." };
  }
}

export async function updateContest(contestId: string, payload: UpdateContestPayload):Promise<updatedContest> {
  try {
    const startTime = new Date(payload.startTime);
    const endTime = new Date(payload.endTime);

    const updatedContest = await prisma.contest.update({
      where: { 
        id: contestId 
      },
      data: {
        title: payload.title,
        description: payload.description,
        startTime,
        endTime,        
        problems: {
          deleteMany: {}, 
            create: payload.problems.map((p) => ({
            problemId: p.id,
            problemPoint: p.points,
          })),
        },
      },
    });

    revalidatePath("/admin/contests");
    revalidatePath(`/contests/${contestId}`);
    revalidatePath("/contests"); 

    return { success: true, contest: updatedContest };

  } catch (error) {
    console.error("Failed to update contest:", error);
    return { success: false, error: "Failed to update contest. Please check the logs." };
  }
}