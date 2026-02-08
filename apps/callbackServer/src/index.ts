import express from "express";

const app = express()

app.use(express.json())

app.put("/update/submission", (req, res) => {
    console.log(req.body)
    return res.sendStatus(200)
})

app.listen(4000, () => {
    console.log("Listening for callback")
})