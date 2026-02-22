const MAX_DB_KB = 150;
import { prisma } from "@repo/db/prisma";
import { J0ResponseType } from "@repo/types";
import { uploadToS3 } from "./uploadS3";


type Payload = J0ResponseType['submissions'];
type TestCaseResult = {
    input?: string;
    output: string;
    isHidden: boolean;
}| undefined;


const calcSize = (jsonObj: TestCaseResult[]) => {

    const stringify = JSON.stringify(jsonObj)

    const bytes = Buffer.byteLength(stringify, 'utf8')
    const kb = bytes / 1024;

    return {bytes, kb}
}


export const outputGenerator = async(codeResult: Payload, submissionId:string, isPublic:number, stdIn:string) => {
    
    const j0Response = codeResult[0] as Payload[number];

    const statusId = j0Response?.status.id
    const j0Output = j0Response?.stdout ?? ""
    const j0OutputDecoded = Buffer.from(j0Output,'base64').toString('utf8').split('\n').slice(0,-1) //to remove last element
    const stdInDecoded    = Buffer.from(stdIn, 'base64').toString('utf-8').split('\n').splice(1) //Since at index will be no of tc
    let totalAcceptedTc = 0;
    let totalRejectedTc = 0;

    console.log(codeResult, j0OutputDecoded)
   
    
    let result = j0OutputDecoded.map((ele, index) => {
        if(ele){
            return {
                input:stdInDecoded[index],
                output:ele,
                isHidden: index >= isPublic
            }
        }
    })

    //give last value of index 
    const {kb} = calcSize(result)

    if(statusId === 5 || statusId > 6){
        const errInput = stdInDecoded[result.length]
        result.push({
            input:errInput,
            output:'err',
            isHidden:result.length >= isPublic

        })
    }
    
    console.log(kb, "kb of data  is recived")

    let updation = {};
    if(Number(kb.toFixed(2)) <= MAX_DB_KB){
        updation = {
                outputInline: result,
                s3URL: null,
                status:'ACCEPTED'
            }
    }else{
        const filename = `problem/`
        updation = {
                outputInline: undefined,
                s3URL: filename,
                status:'ACCEPTED'
            }
        await uploadToS3(filename, result)
    }
    let err = Buffer.from(j0Response.compile_output ?? j0Response.stderr ?? "", 'base64').toString('utf-8');

    switch (statusId) {
        case 5:
            updation = {
                ...updation,
                status:'REJECTED',
                error:err
            }
            break;
        case 6:
            updation = {
                ...updation,
                status:'REJECTED',
                error:err
            }
            break;
        case 7:
            updation = {
                ...updation,
                status:'REJECTED',
                error:err
            }
            break;
    
        default:
            updation = {
                ...updation,
                status:'REJECTED',
                error:err
            }
            break;
    }
  

        await prisma.submission.update({
            where: {
                id: submissionId
            },
            data:updation
        })
    

    // let expectedOutput;

    // const correctOutput = output.filter((i, index) => {
    //     if(index < isPublic){
    //         if(String(i) === String(j0Output[index])){
    //             result.push({
    //                 success:true,
    //                 output: j0Output[index] 
    //             })
    //         }else{
    //             result.push({
    //                 success:false,
    //                 output: j0Output[index] 
    //             })
    //         }
    //     }
    //     return String(i) === String(j0OutputDecoded[index] ?? "")
    // })
    
    // totalAcceptedTc = correctOutput.length;
    // totalRejectedTc = output.length - totalAcceptedTc;

    // console.log(totalAcceptedTc, totalRejectedTc, j0OutputDecoded)
    
}