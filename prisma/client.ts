import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
    // @ts-ignore - Prevent redeclaration errors in some build environments
    var prisma: PrismaClient | undefined;
}

function getPrismaClient() {
    const adapter = new PrismaMariaDb({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        connectionLimit: 5,
        allowPublicKeyRetrieval: true,
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

export const prisma = (global as any).prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
    (global as any).prisma = prisma;
}