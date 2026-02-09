import axios from "axios";
import { Dispatch } from "react";

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function poll(id: string, setResult: Dispatch<any>) {
  let interval = 1000;
  const MAX_TOTAL_TIME = 20000; 
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_TOTAL_TIME) {
    try {
      if (document.hidden) {
        await sleep(800);
        continue;
      }

      const res = await axios(`/api/submissions/${id}`);
      const data = res.data;
      setResult(data);

      if (["ACCEPTED", "REJECTED"].includes(data.submissionStatus.status)) {
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
