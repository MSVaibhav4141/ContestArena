import { Queue } from "bullmq";

const globalQueue = global as unknown as Record<string, Queue>
const connectionConfig = {
    host:process.env.QUEUE_HOST,
    port:process.env.QUEUE_PORT,
    enableReadyCheck:false,
    maxRetriesPerRequest:null
}
export const getQueue = (name:string) => {
    const queue = globalQueue[name] || new Queue('myqueue', {
  connection:connectionConfig
});
    if(process.env.node !== 'PROD') globalQueue[name] = queue;
    return queue;
}
    