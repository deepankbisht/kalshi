import { env } from "bun";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma";

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;

        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

await checkDatabaseConnection();

export { prisma };
