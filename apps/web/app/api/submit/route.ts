import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { J0TestSchema } from "@repo/types";
import axios from "axios";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        msg: "USER NOT AUTHENTICATED",
      },
      { status: 401 },
    );
  }

  const data = await req.json()

  if(!J0TestSchema.safeParse(data)){
    return NextResponse.json(
      {
        msg: "INVALID REQ",
      },
      { status: 400 },
    );
  }

  const J0CLIENT = process.env.J0CLIENT;

  if(!J0CLIENT){
    return NextResponse.json({
        msg: "CLEINT NOT DEFINED",
      },
      { status: 400 },)
  }

  const J0URL = J0CLIENT+"/submissions/batch?base64_encoded=false"

  const response = await axios.post(J0URL, data, {
    headers:{
        'Content-Type':'application/json'
    }
  })

  return NextResponse.json({
    submissions:response
  })

}
