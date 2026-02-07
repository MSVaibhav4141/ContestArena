// app/problems/new/actions.ts
"use server";
import { prisma } from "@repo/db/prisma";
import { generateBoilerPlate } from "@repo/generateboilerplate";
import { auth } from "../../auth";
import axios from "axios";
import { J0Test, ProblemPayload } from "@repo/types";
import { createSlug } from "./helpers/helper";
import { join } from "path";
import fs from 'fs'

export async function createProblemAction(formData: ProblemPayload) {
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
  const {cases,params , problemName,outputType} = code; 
  
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
    output: outputType
  }

  fs.writeFileSync(join(tempPath,'Structure.json'),JSON.stringify(schema))
  
  cases.forEach((testCase:any, tcNo:number) => {
    fs.writeFileSync(join(tempFolderInput,`${tcNo}.txt`), testCase.input)
    fs.writeFileSync(join(tempFolderOutput,`${tcNo}.txt`), testCase.output)
  })
  // Creating inputs and outputs 

  console.log(join(process.cwd(),'temp','problems'), 'hey i am this ')
  const { stdin, language_id, expected_output } = code;

  const submissionPayload = {
    submissions: [
      {
        source_code:
          '#include <iostream>\n\nint main() {\n    int a = 5;\n    int b = 10;\n    std::cout << "Sum is: " << (a + b);\n    return 0;\n}',
        language_id: 54,
        stdin: "",
        expected_output: "Sum is: 15",
      },
    ],
  };

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
