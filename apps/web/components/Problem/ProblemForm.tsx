// app/problems/new/page.tsx
import { ProblemData } from "@repo/types"
import ProblemForm from "./ProblemBuilder"

export default function Page({problem}:{problem?:ProblemData}) {
  return (
      <ProblemForm problem={problem}/>
  )
}
