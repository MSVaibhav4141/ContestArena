import 'dotenv/config'
import { prisma } from "@repo/db/prisma";
import express from "express";

const app = express()
console.log(process.env.DATABASE_URL)
app.use(express.json())

app.put("/update/submission/:tId", async(req, res) => {
    console.log(req.body)

    const tcId = req.params.tId;
    const status = req.body.status.description === 'Accepted' ? "ACCEPTED" : "REJECTED";
    const decodedOutput = Buffer.from(req.body.stdout?? "", 'base64').toString('utf-8').trim();
    const compileOutput = Buffer.from(req.body.compile_output?? "", 'base64').toString('utf-8').trim();

    const tcUpdate = await prisma.testCases.update({
        where:{id:tcId},
        data:{
            status,
            timeTaken:parseFloat(req.body.time),
            memoryTaken:req.body.memory
        }
    })

    if(!tcUpdate){
        return res.json({
            msg:"TESTCASE NOT FOUND"
        }).sendStatus(404)
    }

    await prisma.submission.update({
        where:{
            id:tcUpdate.submissionId
        },
        data:{
            memoryTaken:{
                increment:tcUpdate.memoryTaken || 0
            },
            timeTaken:{
                increment:tcUpdate.timeTaken || 0
            }
        }
    })
    const totalTc = await prisma.testCases.count({
        where:{
            submissionId:tcUpdate.submissionId
        }
    })
    const totalAcceptedTc = await prisma.testCases.count({where: {
        submissionId: tcUpdate.submissionId,
        status:"ACCEPTED"
    }})

    if(totalTc === totalAcceptedTc){
        await prisma.submission.update({
            where:{
                id: tcUpdate.submissionId
            },
            data:{
                status:"ACCEPTED"
            }
        })
    }


console.log("DecodedOutput", decodedOutput);
console.log("CompiledOutput",compileOutput);
    return res.sendStatus(200)
})

app.listen(4000, () => {
    console.log("Listening for callback")
})