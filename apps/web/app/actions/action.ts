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
import {
  InputParam,
  OutputParams,
  ProblemSubmission,
  Structure,
  StructureParams,
} from "@repo/types";
import { createSlug } from "./helpers/helper";


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
  });

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
  });

    const queuePayload = {
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

export async function getProblemById({ id, userId }: { id?: string , userId?: string}) {

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
      output:true
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