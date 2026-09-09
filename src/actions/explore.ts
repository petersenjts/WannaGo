"use server";

import { db } from "@/lib/db";
import { getExploreVisitorId } from "@/lib/explore";

/**
 * Records a like/pass. Public — no auth, anyone browsing Explore can call this.
 *
 * Deliberately does NOT revalidatePath("/explore"): both SwipeDeck and the grid's
 * LikeButton advance through the already-fetched `listings` prop entirely via local
 * client state. Revalidating mid-session would push a freshly-filtered (shorter)
 * listings array back down while SwipeDeck's local `index` has already moved on its
 * own, desyncing the two and making the deck appear empty early. The "exclude
 * already-swiped listings" filter still applies on the next real page load.
 */
export async function recordSwipe(listingId: string, liked: boolean): Promise<void> {
  const visitorId = await getExploreVisitorId();
  if (!visitorId) return;

  await db.exploreVisitor.upsert({
    where: { id: visitorId },
    create: { id: visitorId },
    update: {},
  });

  await db.exploreSwipe.upsert({
    where: { visitorId_listingId: { visitorId, listingId } },
    create: { visitorId, listingId, liked },
    update: { liked },
  });
}
