import "dotenv/config";
import { Worker } from "bullmq";
import express from "express";
import { J0Response, J0ResponseType, J0Test, J0TestSchema, TestCase } from "@repo/types";
import axios from "axios";
import { outputGenerator, resultChecker } from "./helper/tcDbSync";
import { fetchFromS3 } from "./helper/uploadS3";
import { prisma } from "@repo/db/prisma";
const app = express();

// async function submitChunkWithRetry(J0URL: string, chunk: any[], retries = 5) {
//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             const { data } = await axios.post(J0URL, { submissions: chunk }, {
//                 headers: { "Content-Type": "application/json" }
//             });
//             return data;
//         } catch (error: any) {
//             if (error?.response?.status === 503 && attempt < retries) {
//                 // Wait longer each attempt — 2s, 4s, 8s, 16s, 32s
//                 const waitMs = Math.pow(2, attempt) * 1000;
//                 console.log(`503 on attempt ${attempt}, retrying in ${waitMs}ms...`);
//                 await new Promise(res => setTimeout(res, waitMs));
//             } else {
//                 throw error; // give up after all retries
//             }
//         }
//     }
// }

const waitTime = (waitTime:number): Promise<string> =>
  new Promise((res, rej) => {
    setTimeout(() => {
      res("wait time over");
    }, waitTime);
  });
  
  if (!process.env.QUEUE_HOST && !process.env.QUEUE_PORT) {
    console.log(process.env.QUEUE_HOST ,process.env.QUEUE_PORT)
    throw new Error("Invalid Hosts and Port provided");
  }

  
  interface QueuePayload  {
  cases:TestCase[],
  subId:string,
  languageId:number,
  fullCode:string,
  problemId:string
}

interface J0PayloadType {
  "language_id": number,
  "source_code": string,
  "stdin": string
}

interface fetchTestCases {
  id: string;
    input: string;
    output: string;
    isHidden: boolean;
    isErr: string | null;
}

interface TokenId{
  id:string,
  token:string,
  isHidden:boolean
}

interface CheckerQueuePayload{
  code:string,
  problemId:string,
  submissionId:string,
  language_id:number
}

const SUB_BATCH = 20;
const POLL_BATCH = 20;

async function sendRequestWithRetry({J0URL,chunk}:{J0URL:string, chunk:J0PayloadType[]}, retries = 0){
  try{  
    const { data } = await axios.post<{token:string}[]>(
      J0URL,
      {
        submissions:chunk
      },
      {
        headers:{
          'Content-Type': 'application/json'
        }
      }
    )

    return data;
  }catch(e:any){
    console.log("Worker error")
    if(e.response.status == 503){
      if(retries > 5){
        console.log('All retries are exhausted')
        throw e;
      }
      console.log("Retrying again")
      await waitTime(2000)
      return await sendRequestWithRetry({J0URL, chunk}, retries += 1)
    }
    throw e;
  }
}

async function getResponseBatch({J0_REQ_URL}:{J0_REQ_URL:string}, retries = 0){
try{
  const {data} = await axios.get<J0ResponseType>(J0_REQ_URL)
  return data;
}catch(e:any){
  console.log("Error while fetching")
  if(retries < 10){
    console.log("Retrying fetching")
    await waitTime(2000)
    return await getResponseBatch({J0_REQ_URL}, retries += 1)
  }
  throw e
}
}

const checkerWorker = new Worker(
  'user-queue',
  async(job) => {
    try{
      console.log(job.name, 'started')
      const {problemId, code, language_id, submissionId} = job.data as CheckerQueuePayload
      
      //Use to check if tcs are in cache
      const J0_CLIENT = process.env.J0_CLIENT;
      
      if(!J0_CLIENT)throw new Error("Please specify J0Client")
        
        if(!problemId){
          throw new Error('Probem not found')
        }

        const submission = await prisma.submission.findFirst({
          where:{
            problemId
          },
          select:{
            outputInline:true,
            s3URL:true
          }
        })

        let testCases:any;
        if(submission?.s3URL){
           testCases = await fetchFromS3(`problem/${problemId}/generate.json`) as fetchTestCases[]
        }else{
           testCases = submission?.outputInline 
        }

    if(!testCases.length){
      throw new Error('No testcases found');
    }

    const j0Payload = testCases.map((i:any) => {
      return {
        source_code: Buffer.from(code).toString('base64'),
        stdin:       Buffer.from(i.input).toString('base64'),
        expected_output:Buffer.from(i.output).toString('base64'),
        language_id
      }
    })
    
    // Preparing Batch For Submission 
    let globalIndex = 0;
    let tokenString = '';
    const visisbleTcWithId:(Omit<TestCase,"output"> & {token:string})[] = []
    const payloadChunk:(J0PayloadType & {expected_output:string})[][] = []
    for(let i = 0; i < j0Payload.length; i+= SUB_BATCH){
      payloadChunk.push(j0Payload.slice(i, SUB_BATCH + i))
    }

    const J0_SUB_URL = `${J0_CLIENT}/submissions/batch?base64_encoded=true`
    for(let chunk of payloadChunk){
      const data = await sendRequestWithRetry({J0URL:J0_SUB_URL, chunk})

      tokenString += `${tokenString ? "," : ''}` + data.map(i => i.token).join(',')
      
      data.forEach((i, index) => {
        if(!testCases[globalIndex+index]?.isHidden){
          visisbleTcWithId.push({
            id: testCases[globalIndex+index]?.id || "",
            input:testCases[globalIndex+index]?.input || "",
            token : i.token,
            isHidden:testCases[globalIndex+index]?.isHidden
          })
        }
      })
      globalIndex += data.length
      console.log(`${globalIndex}/${j0Payload.length} submitted`);
      job.updateProgress(Math.min((globalIndex*100)/j0Payload.length)/2);

    }

    console.log('All testcases submitted', tokenString.split(",").length, tokenString)
    //Fetching the result

    const tokenArray = tokenString.split(",")
    const pendingToken = new Set(tokenArray)
    const codeResult: J0ResponseType['submissions'] = [];

    while(pendingToken.size > 0){

      const tokenChunk: string[][] = []
      const stillPendingToken = tokenArray.filter(i => pendingToken.has(i))

      for(let i = 0; i < stillPendingToken.length; i += POLL_BATCH){
        tokenChunk.push(stillPendingToken.slice(i , POLL_BATCH + i))
      }

      for(let token of tokenChunk){
        
        const J0_REQ_URL = `${J0_CLIENT}/submissions/batch?base64_encoded=true&tokens=${token.join(",")}` +
                              `&fields=token,stdout,time,memory,stderr,compile_output,message,status,stdin`
        const data = await getResponseBatch({J0_REQ_URL})

        for(let result of data.submissions){
          if(result.status.id !== 1 && result.status.id !== 2){
            codeResult.push({
              ...result,
              stdin: result.stdin ? Buffer.from(result.stdin, 'base64').toString('utf-8') : '',
              stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8') : '',
              compile_output: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf-8') : "",
            })
            pendingToken.delete(result.token)
          }
        }

        console.log(`${codeResult.length}/${tokenArray.length} processed, ${tokenArray.length - codeResult.length} remains`)
        job.updateProgress(50 + Math.min(((codeResult.length/j0Payload.length) * 100)/2))

        await waitTime(2000)
      }

    }
    await resultChecker(codeResult,visisbleTcWithId,submissionId)
    return true;
  }catch(e:any){
    console.log(e)
    throw e
  }
  },
  {
    connection: {
    host:process.env.QUEUE_HOST,
    port:Number(process.env.QUEUE_PORT),
    enableReadyCheck:false,
    maxRetriesPerRequest:null
},
    concurrency: 1, //<- understand this
  },
)

const setterWorker = new Worker(
  'setter-queue',
  async (job) => {
    const {cases, subId, languageId, fullCode, problemId} = job.data as QueuePayload;  
    
    //Defining configs
    const SUB_BATCH_PER_REQ = Number(process.env.SUB_BATCH_PER_REQ) || 20;
    const POLL_BATCH_PER_REQ = Number(process.env.POLL_BATCH_PER_REQ) || 50;
    const J0_CLIENT = process.env.J0_CLIENT;



    if(!J0_CLIENT){
      throw new Error("J0 Client in not set")
    }

    if(cases.length === 0){
      throw new Error("Test cases are not defined")
    }

    if(!subId || !languageId || !fullCode){
      throw new Error("Incomplete payload recived")
    }


    //SUBMISSIOns
    //Preapring payload chunks
    
    const chunkPayload:J0Test[][] = []
    const J0Payload = cases.map((i) => {
      return{
        source_code: Buffer.from(fullCode).toString('base64'),
        stdin:       Buffer.from(i.input).toString('base64'),
        language_id: 54 ///please fix this
      }
    })

    for(let i = 0; i < J0Payload.length; i += SUB_BATCH_PER_REQ){
      chunkPayload.push(J0Payload.slice(i, SUB_BATCH_PER_REQ + i))
    }


    const tokenWithId:TokenId[] = []
    let globalIndex = 0;
    let tokenString = '';
    //Sending chunks to j0

    const J0_SUB_URL = `${J0_CLIENT}/submissions/batch?base64_encoded=true`

    const subStartTime = Date.now();
    for(let chunk of chunkPayload){

      const data = await sendRequestWithRetry({J0URL:J0_SUB_URL, chunk})
      
      tokenString += `${tokenString ? "," : ''}` + data.map(i => i.token).join(',')
      data.forEach((i, index) => {
        tokenWithId.push({
          token: i.token ?? "",
          id: cases[globalIndex + index]?.id ?? "",
          isHidden:cases[globalIndex + index]?.isHidden ?? true
        })
      })

      globalIndex += chunk.length;

      job.updateProgress(Math.min((globalIndex*100)/cases.length)/2);
      console.log(`${globalIndex}/${cases.length} is submitted`);
    }
    const subEndTime = Date.now()

    console.log("All Test Cases are submitted in", (subEndTime - subStartTime)/1000,'seconds', tokenString.split(',').length)


    //Polling to get output 
    const tokenArray = tokenString.split(',')
    const pendingToken = new Set(tokenArray)
    const codeResult:J0ResponseType['submissions'] = []
    
    while(pendingToken.size > 0){
      const tokenChunks:string[][] = []
      const stillPendingToken = tokenArray.filter(i => pendingToken.has(i))
      
      for(let i = 0; i < stillPendingToken.length; i += POLL_BATCH_PER_REQ){
        tokenChunks.push(stillPendingToken.slice(i, POLL_BATCH_PER_REQ + i))
      }
      
      
      for(let chunk of tokenChunks){
        
        const J0_POLL_URL = `${J0_CLIENT}/submissions/batch?base64_encoded=true&tokens=${chunk.join(",")}`+
        '&fields=token,stdout,time,memory,stderr,compile_output,message,status,stdin';
        const {submissions} = await getResponseBatch({J0_REQ_URL:J0_POLL_URL})
        
        for(let data of submissions){
          if(data.status.id !== 1 && data.status.id !== 2){
            codeResult.push(data)
            pendingToken.delete(data.token)
          }
        }
        
        job.updateProgress(50 + Math.min(((codeResult.length/cases.length) * 100)/2))
        await waitTime(2000)
        console.log(`${codeResult.length}/${cases.length} is finished. ${cases.length - codeResult.length} remains`)
      }
      

    }
    
    await outputGenerator(codeResult, tokenWithId, subId, problemId)
    console.log(codeResult)

  },
  {
    connection: {
    host:process.env.QUEUE_HOST,
    port:Number(process.env.QUEUE_PORT),
    enableReadyCheck:false,
    maxRetriesPerRequest:null
},
    concurrency: 1, //<- understand this
  },
)

// const setterWorker = new Worker(
//   "setter-queue",
//   async (job) => {
//     const startTime = Date.now()
//     try {
//       const jobData = job.data as QueuePayload;
      
//       const {subId,languageId , cases,fullCode} = jobData;
      
//       if(!J0URL)throw new Error("J0 URL NOT DEFINED")
//       // const isSafePayload = J0TestSchema.safeParse({...J0Payload});
      
//       // if (!isSafePayload.success) {
//       //   return false;
//       // }
//       const J0_SUB_URL = `${J0URL}/submissions/batch?base64_encoded=true`;
      
    

//     const J0Payload = cases.map((i) => {
//       return{
//       "language_id": languageId,
//       "source_code": Buffer.from(fullCode).toString('base64'),
//       "stdin":Buffer.from(i.input).toString('base64')
//       }
//     })

//     const chunks = [];
//     let globalIndex = 0
//     for(let i = 0; i < cases.length; i+= chunckSize){
//         chunks.push(J0Payload.slice(i, i + chunckSize))
//     }

//     let tokenString:string = "";
//     let tokenWithTcUid:{token:string,id:string, isHidden:boolean}[] = []
//     for(let chunk of chunks){
//       const submissionPayload = {
//         submissions: chunk,
//       };

//       const {data, success, msg} = await sendRequestWithRetry({J0URL:J0_SUB_URL, chunk})
      
//       if(!data){
//         throw new Error(JSON.stringify({
//           data,
//           success,
//           msg
//         }))
//       }
      
//       console.log(`${chunk.length + globalIndex}/${cases.length} submitted`);
//       data.forEach((i, index) => {
//       const caseIndex = globalIndex + index;
//       tokenWithTcUid.push( {
//         token: i.token,
//         id: cases[caseIndex]?.id ?? "",
//         isHidden: cases[caseIndex]?.isHidden ?? true
//       })
//     })
//     tokenString += (tokenString ? ',' : '') + data.map(i => i.token).join(',');
//     globalIndex += chunk.length; 

//     await new Promise((res) => setTimeout(res,500))
//     }




//     const endTime = Date.now()
      
   
//     console.log(tokenString.split(',').length,(startTime- endTime)/1000)

//     if (!tokenString.length) {
//       throw Error("Something wrong in axios response");
//     }

// // After all tokens are collected, poll until everything is done
// const allTokens = tokenString.split(',');
// const totalTokens = allTokens.length;
// const pendingSet = new Set(allTokens); // remove tokens as they complete
// const codeResult: J0ResponseType['submissions'] = [];

// // Split tokens into URL-safe chunks of 200 for GET requests
// const pollChunks: string[][] = [];
// for (let i = 0; i < allTokens.length; i += 50) {
//   pollChunks.push(allTokens.slice(i, i + 50));
// }

// while (pendingSet.size > 0) {
//   await new Promise(res => setTimeout(res, 2000));
//   await job.updateProgress(Math.round(((totalTokens - pendingSet.size) / totalTokens) * 100));

//   for (const pollChunk of pollChunks) {
//     // Only ask about tokens still pending
//     const stillPending = pollChunk.filter(t => pendingSet.has(t));
//     if (stillPending.length === 0) continue;

//     const J0_REQ_URL = `${J0URL}/submissions/batch?base64_encoded=true&tokens=${stillPending.join(',')}&fields=token,stdout,time,memory,stderr,compile_output,message,status`;

//     const data = await getResponseBatch({ J0_REQ_URL });

//     for (const submission of data.submissions) {
//       const done = submission.status.id !== 1 && submission.status.id !== 2;
//       if (done) {
//         pendingSet.delete(submission.token); // remove from pending
//         codeResult.push(submission);
//       }
//     }
//   }

//   console.log(`${codeResult.length}/${totalTokens} processed, ${pendingSet.size} still running`);
// }

// // All done — call outputGenerator
// await outputGenerator(codeResult, tokenWithTcUid, subId);
//       console.log(codeResult, codeResult.length)
//     // while (true) {
//     //   try {
//     //     const { data } = await axios.get<J0ResponseType>(
//     //       `${J0URL}&tokens=${tokenString}&fields=token,stdout,time,memory,stderr,compile_output,message,status,stdin`
//     //     );
      
//     //     const isPending = data.submissions.some(i => (i.status.id === 1 || i.status.id === 2))
//     //     if(!isPending){
//     //       outputGenerator(data.submissions, tokenWithTcUid, subId)
//     //       break;
//     //     }else{
//     //        await waitTime()
//     //         console.log('polling')
//     //     }
//     //     // const payload = data.submissions[0];
//     //     // const status = payload?.status;

//     //     // if (status) {
//     //     //   if(status.id === 1 || status.id === 2){
//     //     //     await waitTime()
//     //     //     console.log('polling')
//     //     //   }else if(payload){
//     //     //       codeResult.push(payload);
//     //     //       outputGenerator(codeResult, submissionId, isPublic, J0Payload.stdin);
//     //     //       break;
//     //     //   }
//     //     // } else {
//     //     //   throw new Error("Status or payload was undefined");
//     //     // }
//     //   } catch (e: any) {
//     //     console.log(e, "this is error");
//     //   }
//     // }
      
//     } catch (error:any) {
//       console.log(error.status, error)
//     }
//   },
//   {
//     connection: {
//     host:process.env.QUEUE_HOST,
//     port:Number(process.env.QUEUE_PORT),
//     enableReadyCheck:false,
//     maxRetriesPerRequest:null
// },
//     concurrency: 3,
//   },
// );

checkerWorker.on('error', (ee) => {
  console.log(ee)
})
checkerWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

checkerWorker.on("failed", (job, err) => {
  if (job) console.log(`${job.id} has failed with ${err.message}`);
});
setterWorker.on('error', (ee) => {
  console.log(ee)
})
setterWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

setterWorker.on("failed", (job, err) => {
  if (job) console.log(`${job.id} has failed with ${err.message}`);
});

app.listen(3001, () => {
  console.log("workers up");
});
