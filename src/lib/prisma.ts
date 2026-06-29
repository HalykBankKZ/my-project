import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://abilmannariman@localhost:5432/growvibe";
  const adapter = new PrismaNeonHttp(connectionString, {});
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
