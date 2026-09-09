import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Used by the Prisma CLI (migrate, studio, introspect) — the app itself
    // connects via the driver adapter in src/lib/db.ts.
    url: env("DATABASE_URL"),
  },
});
