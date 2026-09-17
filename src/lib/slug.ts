import { db } from "@/lib/db";

/**
 * Lowercase, accent-stripped, hyphen-separated slug. Not client-bundle-safe
 * (imports the db client below in the same module graph via co-location) —
 * unlike price-level.ts, this is only ever used from server actions/pages.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Finds a slug guaranteed free at the time of the check, appending -2, -3,
 * ... on collision. Generated once at listing creation and never
 * regenerated on rename, so shared links stay stable.
 */
export async function uniqueExploreSlug(base: string): Promise<string> {
  const root = base || "listing";
  let candidate = root;
  let suffix = 2;
  while (await db.exploreListing.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${suffix}`;
    suffix++;
  }
  return candidate;
}
