// app/problems/new/actions.ts
'use server'
import { prisma } from '@repo/db/prisma'
import {generateBoilerPlate} from '@repo/generateboilerplate'
import { auth } from '../../../auth'
import axios from 'axios';
import { J0Test, ProblemPayload } from '@repo/types';

export async function createProblemAction(formData: ProblemPayload) {

  let problemId:string|null = formData.problemId;


  const session = await auth()
  const user = session?.user.id;
  if(!user){
    return {
      msg:"Unauthorized"
    }
  }

  const {name, description} = formData;
  const startCode  = generateBoilerPlate("",formData)

  if(!startCode){
    return false;
  }

  const db = await prisma.$transaction(async(t) => {

    if(problemId){
      const problem = await t.problem.update({
        where:{
          id:problemId
        },
        data:{
           title:name,
        description,
        slug: `${name.split(" ")[0]}-${name.split(" ")[name.split(" ").length - 1]}`,
          difficulty :"EASY"
        }
      })

        
    await t.startCode.deleteMany({
      where:{
        problemId
      }
    })

    await t.startCode.createMany({
      data:startCode.map(i => {
        return {
          problemId:problem.id,
          ...i
        }
      })
    })
    } 
    else{
      const problem = await t.problem.create({
      data:{
        title:name,
        description,
        slug: `${name.split(" ")[0]}-${name.split(" ")[name.split(" ").length - 1]}`,
        userId: user,
  createdBy:user,
  difficulty :"EASY"
      }
      })
      problemId = problem.id;
        await t.startCode.createMany({
      data:startCode.map(i => {
        return {
          problemId:problem.id,
          ...i
        }
      })
    })
    }
  })


  // 🔥 Replace with DB save
  return {startCode, problemId}
}

export async function submitTestCases(code :J0Test) {
  const {source_code, stdin, language_id, expected_output} = code;

  const submissionPayload = {
        submissions: [
          {
          source_code: "#include <iostream>\n\nint main() {\n    int a = 5;\n    int b = 10;\n    std::cout << \"Sum is: \" << (a + b);\n    return 0;\n}",
          language_id: 54,
          stdin: "",
          expected_output: "Sum is: 15",
         }
      ]
    }
    
  const response:{token:string} = await axios.post(process.env.J0CLIENT+"/submissions?base64_encoded=false&wait=false", code, {
    headers:{
      'Content-Type' : 'application/json'
    }
  })

  
}