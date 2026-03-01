// app/problems/new/page.tsx
import { redirect } from "next/navigation";
import FormShell from "../../../../components/Problem/ProblemForm";
import { getProblemById, getSubmissionById, getUserSubmission } from "../../../actions/action";
import { auth } from "../../../../auth";
import { SubmissionData } from "@repo/types";
import ProblemWorkspace from "../../../../components/Problem/ProblemUser";


export default async function CreateProblemPage({params}:{params:Promise<{id: string[]| undefined}>}) {
  const {id} = await params;
  const problemId = id?.length ? id[0] : undefined
  const session = await auth();
  const problemData = await getProblemById({id:problemId}) 

  
 const submissionData = await getSubmissionById({id:problemData?.id, userId:session?.user.id})
  
 if(!problemData || !session){
  alert("No prb")
  return;
 }

const isCreator = problemData.createdBy === session.user.id ;
const userSubmissionData = isCreator ? await getUserSubmission({problemId:problemData.id, userId: session.user.id}) : []
  
  if(id && !problemData){
    redirect("/page/not/found")
  }
  return (
    <div className="min-h-screen bg-gray-100">
      {isCreator ? (
        <FormShell problem={problemData} submissionData={submissionData}/> 
      ): 
        problemData && (
          <ProblemWorkspace problem={problemData} submission={userSubmissionData} />
        )
      }
    </div>
  )
}
