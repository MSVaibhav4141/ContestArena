import 'dotenv/config'
import { Worker } from 'bullmq';
import express from 'express';
import {J0Test, J0TestSchema} from '@repo/types'
import axios from 'axios';
const app = express()


const checkForValidOutput = (codeResult:any) => {
    console.log(codeResult)
}

  const waitTime = ():Promise<string> => new Promise((res, rej) => {
    setTimeout(() => {
        res('wait time over')
    }, 2000);
  })

const myWorker = new Worker('myqueue', async job => {
    const data = job.data as J0Test;
    const isSafePayload = J0TestSchema.safeParse(data)
    
    if(!isSafePayload.success){
        return false;
    }
    
    const J0URL = process.env.J0ClIENT + "/submissions/batch?base64_encoded=true";
    
    const submissionPayload = {
        submissions:[
            {...data}
        ]
    }
    console.log(isSafePayload.success, process.env.J0ClIENT)
    const response = await axios.post(J0URL, submissionPayload , {
        headers: { 
            "Content-Type": "application/json",
        },
    });

    const token = response.data[0].token;
  const codeResult = [];

  while(true){

    try{
        console.log(`${J0URL}&token=${token}`)
        const output =await axios.get(`${J0URL}&tokens=${token}`)
        const payload = output.data.submissions[0]
        const status = output.data.submissions[0].status
        console.log(status)
        
        if(status.id === 1 || status.id === 2){
            await waitTime()
            console.log('polling')
        }else{
            codeResult.push(payload)
            checkForValidOutput(codeResult);
            break;
        }
    }catch(e:any){
        console.log(e.response,'this is error')
    }
  }


}, {
  connection: {
    host: '127.0.0.1',
    port: 6381,
  },
  concurrency: 5
});

myWorker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

myWorker.on('failed', (job, err) => {
    if(job)
  console.log(`${job.id} has failed with ${err.message}`);
});

app.listen(3001, () => {
    console.log("workers up")
})