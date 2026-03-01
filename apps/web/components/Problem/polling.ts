import axios from "axios";
import { Dispatch, SetStateAction } from "react";
import { UserWorkspaceProps } from "./ProblemUser";
function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function poll(id: string, setResult: Dispatch<any>, jobId:string,setProgress:Dispatch<SetStateAction<number>>) {
  let interval = 1000;
  const MAX_TOTAL_TIME = 2000000; 
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_TOTAL_TIME) {
    try {
      if (document.hidden) {
        await sleep(800);
        continue;
      }
      const res = await axios(`/api/submissions/${jobId}/${id}`);
      const data = res.data;
      if(data.jobProgress !== 100){
        setProgress(data.jobProgress ?? 0)
      }

      if (["ACCEPTED", "REJECTED"].includes(data.submissionStatus.status)) {
        console.log(data)
        setResult(data);
        setProgress(95)
        return data;
      }

    } catch (err) {
      console.error("poll error", err);
    }

    await sleep(interval);

    // grow delay but don’t exceed remaining allowed time
    const elapsed = Date.now() - startTime;
    const remaining = MAX_TOTAL_TIME - elapsed;

    interval = Math.min(interval * 1.5, remaining, 3000); 
    // 3000 cap keeps UI responsive
  }

  throw new Error("Polling stopped after 8 seconds timeout");
}

export async function pollUser({id, setSubmission, setConsoleResult, jobId, setProgress}:{id:string,setSubmission:Dispatch<SetStateAction<UserWorkspaceProps['submission']>>, setConsoleResult:any, jobId:string,setProgress:Dispatch<SetStateAction<number>>}){
  
  const startTime = Date.now();
  while(true){
    
    const {data} = await axios.get<{submission:UserWorkspaceProps['submission'][number] | undefined, jobProgress: number}>(`/api/user/submission/${id}/${jobId}`);

    const submission = data.submission;
    const progress = data.jobProgress

    if(progress !== 100)setProgress(progress ?? 0);
    
    if(submission){
      setSubmission((prev) => {
        if(!prev){
          return [submission]
        }else{
          return [...prev, submission]
        }
      })  
      console.log(submission)
      setConsoleResult({
            input: submission?.outputInline.map((i:any) => i.stdin),
            output: submission?.outputInline.map((i:any) => i.stdout),
            statusId: submission?.outputInline.map((i:any) => i.status.id),
      })
     return true;
    }
    console.log("polling")

    if((Date.now() - startTime)/1000 > 20){
      return false
    }
    await sleep(2000)
  }
}