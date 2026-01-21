import {prisma} from "@repo/db/prisma"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse>{
    const users = await prisma.user.findMany()
    return NextResponse.json({
        users:!users.length ? "No users added yet" : users,
        msg:"I am not fine"
    })
}

