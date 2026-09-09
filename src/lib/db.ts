import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg(connectionString);
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

function getClient(): PrismaClient {
  return (globalForPrisma.prisma ??= createClient());
}

// A lazy proxy — constructing the real client (which reads DATABASE_URL)
// only happens on first actual use, not on import. Next.js imports every
// page module during its build-time page-data collection step without
// calling anything in it, and DATABASE_URL isn't available at build time
// (only injected into the running container), so an eager client here
// would break the production build.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient() as object, prop, receiver);
  },
});
