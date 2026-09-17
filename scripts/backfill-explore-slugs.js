// One-off, run-once (but safe to rerun) backfill for ExploreListing rows
// created before the `slug` column existed. Duplicates the slugify logic
// from src/lib/slug.ts intentionally — this is a standalone script (no
// ts-node/tsx in this repo) and isn't worth a build step to share it.
//
// Usage: node scripts/backfill-explore-slugs.js

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");
  const adapter = new PrismaPg(connectionString);
  const db = new PrismaClient({ adapter });

  const rows = await db.exploreListing.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  console.log(`Found ${rows.length} listing(s) without a slug.`);

  for (const row of rows) {
    const root = slugify(row.name) || "listing";
    let candidate = root;
    let suffix = 2;
    while (await db.exploreListing.findUnique({ where: { slug: candidate } })) {
      candidate = `${root}-${suffix}`;
      suffix++;
    }
    await db.exploreListing.update({ where: { id: row.id }, data: { slug: candidate } });
    console.log(`  ${row.name} -> ${candidate}`);
  }

  await db.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
