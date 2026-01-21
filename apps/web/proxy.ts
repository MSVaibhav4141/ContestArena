import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export const config = {     
  matcher: ['/((?!api|_next/static|_next/image|$|favicon.ico).*)']
}

export  async function proxy(req:NextRequest) {
    const session = await auth()
    if(!session?.user){
        return NextResponse.json({
            msg:"User not authenticated"
        },
        {status:401})
    }
    
    const isAdmin = req.nextUrl.pathname.startsWith('/admin')

    if(isAdmin && session.user.role !== 'ADMIN'){
        return NextResponse.json({
            msg:"User not authenticated"
        },
        {status:401})
    }
    
    return NextResponse.next()
}
