import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Singleton Prisma client instance.
 * In development, we store the client on `globalThis` to prevent
 * creating too many connections during hot-reloading.
 * Initialization is deferred until first use so that the module can be
 * imported safely in environments where DATABASE_URL is not required
 * (e.g. during Next.js build-time static analysis).
 *
 * The Proxy delegates all property accesses to the lazily-initialized
 * PrismaClient. Additional traps (has, ownKeys, etc.) are intentionally
 * omitted — all Prisma operations in this application are simple property
 * accesses (e.g. prisma.user.findMany()), so these traps are not needed.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
