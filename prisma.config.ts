import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Used by the Prisma CLI (migrate, studio, introspect) — the app itself
    // connects via the driver adapter in src/lib/db.ts. Read directly from
    // process.env (rather than the config's `env()` helper, which throws if
    // unset) so `prisma generate` still works during the Docker build, where
    // DATABASE_URL isn't available yet — it's only injected at container
    // runtime.
    url: process.env.DATABASE_URL,
  },
});
