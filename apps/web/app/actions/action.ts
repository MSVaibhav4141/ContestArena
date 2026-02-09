// app/problems/new/actions.ts
"use server";
import { prisma } from "@repo/db/prisma";
import { generateBoilerPlate, generateFullCode } from "@repo/generateboilerplate";
import { auth } from "../../auth";
import axios from "axios";
import { J0Test, ProblemPayload, Structure, TestCase } from "@repo/types";
import { createSlug } from "./helpers/helper";
import { join } from "path";
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid';


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
  const {cases,params , problemName,outputType, codevaleCurrent,problemId,language, languageId} = code; 
  
  const session = await auth()

  const user = session?.user.id;
  if (!user) {
    return {
      msg: "Unauthorized",
    };
  }


  const slug = createSlug(problemName);

  const tempPath = join(process.cwd(),'temp','problems',slug)
  const tempFolderInput = join(process.cwd(),'temp','problems',slug, 'inputs')
  const tempFolderOutput = join(process.cwd(),'temp','problems',slug, 'outputs')

  //Creating temp filder
  if(!fs.existsSync(tempPath)){
    fs.mkdirSync(tempPath, {recursive:true})
    fs.mkdirSync(tempFolderInput, {recursive:true})
    fs.mkdirSync(tempFolderOutput, {recursive:true})
  }

  const schema = {
    name: slug,
    inputs: params.map((i:any) => ({name:i.name, type: i.type})),
    output: {type:outputType}
  }

  fs.writeFileSync(join(tempPath,'Structure.json'),JSON.stringify(schema))
  
  cases.forEach((testCase:any, tcNo:number) => {
    fs.writeFileSync(join(tempFolderInput,`${tcNo}.txt`), testCase.input)
    fs.writeFileSync(join(tempFolderOutput,`${tcNo}.txt`), testCase.output)
  })
  console.log(codevaleCurrent.language)
  const fullCode = generateFullCode(codevaleCurrent.language.toUpperCase(), join(tempPath,'Structure.json'),codevaleCurrent.code)

  const submissions:any = [];
  const testCasesArray:(TestCase & { submissionId: string })[] = []

   console.log(problemId, "Hey i am problem id")
  await prisma.$transaction(async (txn) => {
     const submission =  await txn.submission.create({
        data:{
          userId: user,
          problemId,
          languageId:language === 'cpp' ? 1 : language === 'rust' ? 2 : language === 'javascript' ? 3 : 1,
          code: String(code),
          fullCode: String(fullCode)
        }
      })

       for(let i = 0;i < cases.length; i++){
    const stdinData = fs.readFileSync(join(tempFolderInput,`${i}.txt`),'utf-8')
    const stdoutData = fs.readFileSync(join(tempFolderOutput,`${i}.txt`),'utf-8')

    const testCaseId = uuidv4() 
    const payload = {
      "source_code": Buffer.from(fullCode).toString('base64'),
      "language_id": languageId,
      "stdin": Buffer.from(stdinData).toString('base64'),
      "expected_output": Buffer.from(stdoutData).toString('base64'),
      "callback_url":`${process.env.J0URL}:8080/update/submission/${testCaseId}`
    }

    submissions.push(payload)
    testCasesArray.push({
      id: testCaseId,
      submissionId:submission.id,
      input:stdinData,
      output:stdoutData,
    })
    }

      const testCases = await txn.testCases.createMany({
        data: testCasesArray
      })
  })


  
    const submissionPayload = {
      submissions
    }
  console.log(fullCode)
  console.log(submissionPayload)

  const J0URL = process.env.J0ClIENT+'/submissions/batch?base64_encoded=true'
  console.log(J0URL)
  const response = await axios.post(J0URL,submissionPayload,{
    headers:{
      'Content-Type':'application/json'
    }
  })

  console.log(response.data)
  // Creating inputs and outputs 
  // const { stdin, language_id, expected_output } = code;

  // const submissionPayload = {
  //   submissions: [
  //     {
  //       source_code:
  //         '#include <iostream>\n\nint main() {\n    int a = 5;\n    int b = 10;\n    std::cout << "Sum is: " << (a + b);\n    return 0;\n}',
  //       language_id: 54,
  //       stdin: "",
  //       expected_output: "Sum is: 15",
  //     },
  //   ],
  // };

  // const response: { token: string } = await axios.post(
  //   process.env.J0CLIENT + "/submissions?base64_encoded=false&wait=false",
  //   code,
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   },
  // );
}
