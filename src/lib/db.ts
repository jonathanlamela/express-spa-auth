import { PrismaClient } from "../generated/prisma";

export default function getDb() {
    const prisma = new PrismaClient();
    return prisma;
}
