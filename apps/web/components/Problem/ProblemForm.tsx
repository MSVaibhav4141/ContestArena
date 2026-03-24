// app/problems/new/page.tsx
import { ProblemData, SubmissionData } from "@repo/types"
import ProblemForm from "./ProblemBuilder"

export default function Page({problem, submissionData}:{problem?:ProblemData, submissionData:SubmissionData}) {
  return (
      <ProblemForm problem={problem} submissionData={submissionData}/>
  )
}
