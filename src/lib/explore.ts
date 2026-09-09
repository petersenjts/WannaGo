import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Vertical } from "@prisma/client";

export const EXPLORE_VISITOR_COOKIE = "wannago_explore_visitor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads the anonymous Explore visitor id from the cookie, if present and well-formed. */
export async function getExploreVisitorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(EXPLORE_VISITOR_COOKIE)?.value;
  return id && UUID_RE.test(id) ? id : null;
}

/**
 * The anonymous → known-customer join. Called the moment someone's identity
 * becomes known (submits a request, or logs into the portal) — links this
 * browser's Explore swipe history to their Customer record, but only if it
 * isn't linked to someone else already (first-touch, idempotent).
 */
export async function linkExploreVisitorToCustomer(customerId: string): Promise<void> {
  const visitorId = await getExploreVisitorId();
  if (!visitorId) return;

  await db.exploreVisitor.updateMany({
    where: { id: visitorId, customerId: null },
    data: { customerId },
  });
}

export type ExploreSignal = {
  likedListingNames: string[];
  tags: string[];
  priceLevelMin: number | null;
  priceLevelMax: number | null;
};

/**
 * What a customer has liked on Explore, scoped to one vertical — surfaced on
 * the admin request detail page while building a shortlist.
 */
export async function getExploreSignal(customerId: string, vertical: Vertical): Promise<ExploreSignal | null> {
  const swipes = await db.exploreSwipe.findMany({
    where: {
      liked: true,
      listing: { vertical },
      visitor: { customerId },
    },
    include: { listing: true },
    distinct: ["listingId"],
  });

  if (swipes.length === 0) return null;

  const tagSet = new Set<string>();
  let min: number | null = null;
  let max: number | null = null;

  for (const s of swipes) {
    for (const tag of s.listing.tags) tagSet.add(tag);
    min = min === null ? s.listing.priceLevel : Math.min(min, s.listing.priceLevel);
    max = max === null ? s.listing.priceLevel : Math.max(max, s.listing.priceLevel);
  }

  return {
    likedListingNames: swipes.map((s) => s.listing.name),
    tags: [...tagSet],
    priceLevelMin: min,
    priceLevelMax: max,
  };
}

