// Deliberately dependency-free (no db, no next/headers) — this needs to be
// safely importable from client components (e.g. swipe-card.tsx), which
// pulls its whole import graph into the browser bundle. lib/explore.ts
// imports Prisma/next-headers and would break that if this lived there.
export function priceLevelLabel(level: number): string {
  return "€".repeat(Math.max(1, Math.min(4, level)));
}
