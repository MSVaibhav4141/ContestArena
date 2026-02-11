// app/problems/new/page.tsx
import FormShell from "../../../../components/Problem/ProblemForm";
import { getProblemById } from "../../../actions/action";

export default async function CreateProblemPage({params}:{params:Promise<{id: string[]| undefined}>}) {
  const {id} = await params;
  const problemId = id?.length ? id[0] : undefined

  const problemData = await getProblemById({id:problemId}) 
  return (
    <div className="min-h-screen bg-gray-100">
      <FormShell problem={problemData}/>
    </div>
  )
}
