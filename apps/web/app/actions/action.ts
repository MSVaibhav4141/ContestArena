// app/problems/new/actions.ts
"use server";
import { prisma } from "@repo/db/prisma";
import { generateBoilerPlate, generateFullCode } from "@repo/generateboilerplate";
import { auth } from "../../auth";
import axios from "axios";
import { J0Test, ProblemPayload, ProblemSubmission, Structure, StructureParams, TestCase } from "@repo/types";
import { createSlug } from "./helpers/helper";
import { join } from "path";
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from "./helpers/uploadS3";


export async function createProblemAction(formData: Structure) {
  let problemId: string | null = formData.problemId;

  const session = await auth();
  const user = session?.user.id;
  if (!user) {
    return {
      msg: "Unauthorized",
    };
  }

  const { name, description } = formData;

  
  const startCode = generateBoilerPlate("", formData);

  if (!startCode) {
    return false;
  }
  const slug = createSlug(name);
  const db = await prisma.$transaction(async (t) => {
    const fileName = `problems/${slug}/test-cases.json`
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
          testCase: fileName

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
          testCase: fileName
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
  const {cases,params ,subId, problemName,outputType, codevaleCurrent,problemId,language, languageId} = code; 
  
  const session = await auth()

  const user = session?.user.id;
  if (!user) {
    return {
      msg: "Unauthorized",
    };
  }


  const slug = createSlug(problemName);


  const schema: Structure = {
    name: slug,
    inputs: params.map((i:any) => ({name:i.name, type: i.type})) as StructureParams[],
    output: {type:outputType},
    description:'',  // <--- fixthus
    problemId
  }
  
  const casesJSON = cases.map((i:any) => {
    const testCaseId = uuidv4() 
    return {
      id:testCaseId,
      input: i.input,
      output: i.output
    }
  })

  const fullCode = generateFullCode(codevaleCurrent.language.toUpperCase(), schema,codevaleCurrent.code, problemName)

  const submissions:any = [];
  const testCasesArray:(TestCase & { submissionId: string, identity:string })[] = []

  await prisma.$transaction(async (txn) => {
     const submission =  await txn.submission.create({
        data:{
          id:subId,
          userId: user,
          problemId,
          languageId:language === 'cpp' ? 1 : language === 'rust' ? 2 : language === 'javascript' ? 3 : 1,
          code: String(codevaleCurrent.code),
        }
      })

       for(let i = 0;i < cases.length; i++){
      
    const payload = {
      "source_code": Buffer.from(fullCode).toString('base64'),
      "language_id": languageId,
      "stdin": Buffer.from(cases[i].input).toString('base64'),
      "expected_output": Buffer.from(cases[i].output).toString('base64'),
      "callback_url":`${process.env.J0URL}:8080/update/submission/${casesJSON[i].id}`
    }

    submissions.push(payload)

    const tcPaylaod = {
      ...(casesJSON[i]),
      identity: cases[i].id,
      submissionId:submission.id,
    } 
    testCasesArray.push(tcPaylaod)
    }
     await txn.testCases.createMany({
        data: testCasesArray
      })
  })

  //Push Testcase to s3
    const fileName = `problems/${slug}/test-cases.json`

    await uploadToS3(fileName, JSON.stringify(casesJSON))
    const submissionPayload = {
      submissions
    }

  const J0URL = process.env.J0ClIENT+'/submissions/batch?base64_encoded=true'
  await axios.post(J0URL,submissionPayload,{
    headers:{
      'Content-Type':'application/json'
    }
  })
  return {submissionId:subId}
}

export async function submitProblem(props: ProblemSubmission){

    const { submissionId } = props; 

    if(!submissionId){
      throw Error("No submission ID recived")
    }

    const submission = await prisma.submission.findUnique({
      where:{
        id: submissionId,
        status:"ACCEPTED"
      }
    })

    if(!submission){
       throw Error("Submission still not accepted") 
    }

    const problemId = submission.problemId;




    
}
