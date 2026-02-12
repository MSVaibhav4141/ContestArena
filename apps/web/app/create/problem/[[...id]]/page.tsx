// app/problems/new/page.tsx
import { redirect } from "next/navigation";
import FormShell from "../../../../components/Problem/ProblemForm";
import { getProblemById } from "../../../actions/action";
import { auth } from "../../../../auth";

export default async function CreateProblemPage({params}:{params:Promise<{id: string[]| undefined}>}) {
  const {id} = await params;
  const problemId = id?.length ? id[0] : undefined
  const session = await auth();
  const problemData = await getProblemById({id:problemId, userId: session?.user.id}) 

  if(id && !problemData){
    redirect("/page/not/found")
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <FormShell problem={problemData}/>
    </div>
  )
}
