import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
    var prisma: PrismaClient | undefined;
}

function getPrismaClient() {
    const adapter = new PrismaMariaDb({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        // Fallback for environments that only expose DATABASE_URL.
        connectionString: process.env.DATABASE_URL,
        connectionLimit: 5,
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

export const prisma = global.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}