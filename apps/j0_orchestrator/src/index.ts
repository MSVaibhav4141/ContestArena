import "dotenv/config";
import { Worker } from "bullmq";
import express from "express";
import { J0Response, J0ResponseType, J0Test, J0TestSchema } from "@repo/types";
import axios from "axios";
import { outputGenerator } from "./helper/tcDbSync";
const app = express();

const waitTime = (): Promise<string> =>
  new Promise((res, rej) => {
    setTimeout(() => {
      res("wait time over");
    }, 2000);
  });
  
  if (!process.env.QUEUE_HOST && !process.env.QUEUE_PORT) {
    console.log(process.env.QUEUE_HOST ,process.env.QUEUE_PORT)
    throw new Error("Invalid Hosts and Port provided");
  }

const setterWorker = new Worker(
  "setter-queue",
  async (job) => {

    const data = job.data as J0Test & {submissionId:string, isPublic:number};
    const {submissionId,isPublic, ...J0Payload} = data;

    const isSafePayload = J0TestSchema.safeParse({...J0Payload});
  
    if (!isSafePayload.success) {
      return false;
    }

    const J0URL = process.env.J0ClIENT + "/submissions/batch?base64_encoded=true";

    const submissionPayload = {
      submissions: [{ ...J0Payload }],
    };

    const response = await axios.post<{ token: string }[]>(
      J0URL,
      submissionPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const token = response.data[0]?.token;

    if (!token) {
      throw Error("Something wrong in axios response");
    }

    const codeResult: J0ResponseType['submissions'] = [];

    while (true) {
      try {
        const { data } = await axios.get<J0ResponseType>(
          `${J0URL}&tokens=${token}`,
        );
        const payload = data.submissions[0];
        const status = payload?.status;

        if (status) {
          if(status.id === 1 || status.id === 2){
            await waitTime()
            console.log('polling')
          }else if(payload){
              codeResult.push(payload);
              outputGenerator(codeResult, submissionId, isPublic, J0Payload.stdin);
              break;
          }
        } else {
          throw new Error("Status or payload was undefined");
        }
      } catch (e: any) {
        console.log(e, "this is error");
      }
    }
  },
  {
    connection: {
    host:process.env.QUEUE_HOST,
    port:Number(process.env.QUEUE_PORT),
    enableReadyCheck:false,
    maxRetriesPerRequest:null
},
    concurrency: 5,
  },
);

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
