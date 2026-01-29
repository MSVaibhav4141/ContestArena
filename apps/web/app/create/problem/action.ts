// app/problems/new/actions.ts
'use server'
import { prisma } from '@repo/db/prisma'
import {generateBoilerPlate} from '@repo/generateboilerplate'
import { auth } from '../../../auth'
type BaseType = "int" | "long" | "double" | "bool" | "char" | "string"
type SpecialType = "TreeNode" | "ListNode"

type ParamType =
  | BaseType
  | SpecialType
  | `${BaseType}[]`
  | `${BaseType}[][]`

interface InputParam {
  id: string
  name: string
  type: ParamType
}

interface ProblemPayload {
  name: string,
  description:string,
  inputs: InputParam[]
  output: { type: ParamType }
}

export async function createProblemAction(formData: ProblemPayload) {

  const session = await auth()
  const user = session?.user.id;
  if(!user){
    return {
      msg:"Unauthorized"
    }
  }

  const {name, description} = formData;
  const startCode = generateBoilerPlate("",formData)

  if(!startCode){
    return false;
  }

  const db = await prisma.$transaction(async(t) => {

    const problem = await t.problem.create({
      data:{
  title: name, 
  description,
  slug: `${name.split("")[0]}-${name.split("")[name.split("").length - 1]}`,
  userId: user,
  createdBy:user,
  difficulty :"EASY"
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
  })
  // 🔥 Replace with DB save
  return startCode
}