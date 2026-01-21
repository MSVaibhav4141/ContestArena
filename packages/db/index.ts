import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

const globalPrisma = global as unknown as {prisma: PrismaClient}

const prisma = globalPrisma.prisma ?? new PrismaClient({adapter})

if(process.env.ENV !== "PROD") globalPrisma.prisma = prisma;

export {prisma}