import { prisma } from "@repo/db/prisma";
import NextAuth, { NextAuthResult } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const nextConfig = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { 
    strategy: "jwt",
  },

    callbacks:{
    async signIn({user}){
      
      if(!user){
        return false;
      }

      const isUser = await prisma.user.findUnique({
        where:{
          email : user.email as string
        }
      })
      if(!isUser){
        await prisma.user.create({
          data:{
            email: user.email as string,
            name:user.name as string,
            image: user.image ?? "",
          }
        })
      }
      return true;
    },

      async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export const handlers: NextAuthResult['handlers'] = nextConfig.handlers;
export const auth: NextAuthResult['auth'] = nextConfig.auth;
export const signIn: NextAuthResult['signIn'] = nextConfig.signIn;
export const signOut: NextAuthResult['signOut'] = nextConfig.signOut;