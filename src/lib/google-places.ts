// Thin wrapper around the Google Places API (New) REST endpoints — no SDK
// dependency, matching this codebase's preference for calling third-party
// REST APIs directly (see cloudinary.ts). The API key is checked lazily
// inside each function (not at module load) so a missing/malformed key only
// fails an actual Google call, not every page that imports this module.

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const REQUEST_TIMEOUT_MS = 8000;

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is not set");
  }
  return key;
}

export type GooglePlaceCandidate = {
  placeId: string;
  name: string;
  formattedAddress: string;
  primaryTypeLabel: string | null;
};

export type GooglePlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string;
  neighborhood: string | null;
  priceLevel: number | null; // mapped to this app's 1-4 scale
  rating: number | null;
  reviewCount: number | null;
  primaryTypeLabel: string | null;
};

type GoogleDisplayName = { text?: string; languageCode?: string };
type GoogleAddressComponent = { longText?: string; shortText?: string; types?: string[] };

type GoogleSearchTextPlace = {
  id?: string;
  displayName?: GoogleDisplayName;
  formattedAddress?: string;
  primaryTypeDisplayName?: GoogleDisplayName;
};

type GooglePlaceDetailsResponse = {
  id?: string;
  displayName?: GoogleDisplayName;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  priceLevel?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  primaryTypeDisplayName?: GoogleDisplayName;
};

/**
 * Maps Google's PriceLevel enum down to this app's existing 1-4 scale
 * (there's no separate "free" bucket here, so FREE and INEXPENSIVE both
 * land on 1 — real-world hotels/restaurants are essentially never FREE).
 */
export function mapGooglePriceLevel(level: string | undefined): number | null {
  switch (level) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return null;
  }
}

/**
 * Derives a neighborhood/area string from Google's address components,
 * preferring a sublocality/neighborhood-level component and falling back
 * to the locality (city) if nothing more specific is available.
 */
export function deriveNeighborhood(components: GoogleAddressComponent[] | undefined): string | null {
  if (!components) return null;
  const byType = (type: string) => components.find((c) => c.types?.includes(type));
  const specific =
    byType("neighborhood") ?? byType("sublocality_level_1") ?? byType("sublocality");
  if (specific?.longText) return specific.longText;
  const locality = byType("locality");
  return locality?.longText ?? null;
}

/**
 * Prefers Google's own human-readable type label (e.g. "Italian Restaurant")
 * over hand-building a mapping table for Google's ~150 raw food-type strings.
 * Falls back to title-casing the raw type if a display name is ever absent.
 */
export function derivePrimaryTypeLabel(
  primaryType: string | undefined,
  primaryTypeDisplayName: GoogleDisplayName | undefined
): string | null {
  if (primaryTypeDisplayName?.text) return primaryTypeDisplayName.text;
  if (!primaryType) return null;
  return primaryType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function placesFetch(url: string, init: RequestInit, fieldMask: string): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Places API request failed (${res.status}): ${body || res.statusText}`);
  }
  return res;
}

/**
 * Text Search — the candidate picker. Field mask is limited to cheap
 * Essentials/Pro fields only, since an admin may search/retype several
 * times per listing; rating/price/review count are deliberately left out
 * here and only fetched once, for the confirmed selection, via getPlaceDetails.
 */
export async function searchPlaces(query: string): Promise<GooglePlaceCandidate[]> {
  const res = await placesFetch(
    `${PLACES_API_BASE}/places:searchText`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textQuery: query }),
    },
    "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName"
  );
  const data = (await res.json()) as { places?: GoogleSearchTextPlace[] };
  return (data.places ?? [])
    .filter((p): p is GoogleSearchTextPlace & { id: string } => Boolean(p.id))
    .map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? "Unnamed place",
      formattedAddress: p.formattedAddress ?? "",
      primaryTypeLabel: derivePrimaryTypeLabel(undefined, p.primaryTypeDisplayName),
    }));
}

/**
 * Place Details — the one authoritative enrichment fetch. Includes the
 * priciest ("Enterprise") tier fields (priceLevel, rating, userRatingCount),
 * so this must be called exactly once per confirmed selection or explicit
 * refresh — never per search, never on public page views.
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const res = await placesFetch(
    `${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}`,
    { method: "GET" },
    "id,displayName,formattedAddress,addressComponents,priceLevel,rating,userRatingCount,primaryType,primaryTypeDisplayName"
  );
  const data = (await res.json()) as GooglePlaceDetailsResponse;
  return {
    placeId: data.id ?? placeId,
    name: data.displayName?.text ?? "Unnamed place",
    formattedAddress: data.formattedAddress ?? "",
    neighborhood: deriveNeighborhood(data.addressComponents),
    priceLevel: mapGooglePriceLevel(data.priceLevel),
    rating: typeof data.rating === "number" ? data.rating : null,
    reviewCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
    primaryTypeLabel: derivePrimaryTypeLabel(data.primaryType, data.primaryTypeDisplayName),
  };
}
