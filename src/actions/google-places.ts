"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { searchPlaces, getPlaceDetails, type GooglePlaceCandidate, type GooglePlaceDetails } from "@/lib/google-places";

export type SearchPlacesResult = { ok: true; candidates: GooglePlaceCandidate[] } | { ok: false; error: string };

export async function searchGooglePlaces(query: string): Promise<SearchPlacesResult> {
  await requireAdmin();
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: "Type a name to search for." };
  try {
    const candidates = await searchPlaces(trimmed);
    return { ok: true, candidates };
  } catch (err) {
    console.error("Google Places search failed:", err);
    return { ok: false, error: "Couldn't reach Google — you can still fill in the fields below by hand." };
  }
}

export type PlaceDetailsResult = { ok: true; details: GooglePlaceDetails } | { ok: false; error: string };

export async function fetchGooglePlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
  await requireAdmin();
  try {
    const details = await getPlaceDetails(placeId);
    return { ok: true, details };
  } catch (err) {
    console.error("Google Places details fetch failed:", err);
    return { ok: false, error: "Couldn't reach Google — you can still fill in the fields below by hand." };
  }
}

/**
 * Re-syncs rating/review count/address/cuisine for an already-linked
 * listing. Deliberately does NOT touch priceLevel or neighborhood — those
 * are shared with manual entry and may have been hand-edited after the
 * initial link, so refresh must never silently revert them. On failure this
 * no-ops rather than partially overwriting.
 */
export async function refreshListingFromGoogle(listingId: string): Promise<void> {
  await requireAdmin();

  const listing = await db.exploreListing.findUnique({ where: { id: listingId } });
  if (!listing?.googlePlaceId) return;

  try {
    const details = await getPlaceDetails(listing.googlePlaceId);
    await db.exploreListing.update({
      where: { id: listingId },
      data: {
        googleFormattedAddress: details.formattedAddress || null,
        googleRating: details.rating,
        googleReviewCount: details.reviewCount,
        cuisine: listing.vertical === "DINE" ? details.primaryTypeLabel : listing.cuisine,
        googleLastSyncedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Google Places refresh failed:", err);
    return;
  }

  revalidatePath("/admin/explore");
  revalidatePath(`/admin/explore/${listingId}`);
}
