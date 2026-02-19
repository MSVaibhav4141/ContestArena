import { J0ResponseType } from "@repo/types";


type Payload = J0ResponseType['submissions'];

export const checkForValidOutput = (codeResult: Payload) => {
    
    const j0Response = codeResult[0]?.stdout;
    console.log(atob(j0Response || ""))
    // const statusId = j0Response?.status.id

    // const totalAcceptedTc = 0;
    // const totalRejectedTc = 0;
    
    // const output = '1/n2/n3'.split('/n')
    // const 
    // codeResult.forEach((ele: Payload[number], key: number) => {
        
    //     switch(statusId){
    //         case 3:

                
    //     }
    // })

    
}