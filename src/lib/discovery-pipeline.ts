import { db } from "@/lib/db";
import { searchPlaces, getPlaceDetails } from "@/lib/google-places";
import { scrapeWebsite } from "@/lib/website-scraper";
import { generateListingContent } from "@/lib/claude-content";
import { slugify, uniqueExploreSlug } from "@/lib/slug";
import type { Vertical } from "@prisma/client";

// Planning estimates only, not measured — see explore/discover page copy,
// which labels these as estimates. Confirm against Google's current pricing
// page before relying on these for real budgeting:
// https://developers.google.com/maps/billing-and-pricing/pricing
const PLACE_DETAILS_ENTERPRISE_PRICE_USD = 0.02; // $20 / 1,000 calls, base volume tier
const ASSUMED_INPUT_TOKENS = 2500;
const ASSUMED_OUTPUT_TOKENS = 800;
const CLAUDE_INPUT_PRICE_PER_MTOK = 2;
const CLAUDE_OUTPUT_PRICE_PER_MTOK = 10;

export type DiscoveryParams = {
  area: string;
  vertical: Vertical;
  minRating: number | null;
  minReviewCount: number | null;
};

export type PreviewCandidate = { placeId: string; name: string; address: string };

export type PreviewResult = {
  candidates: PreviewCandidate[];
  estimatedGoogleCostUsd: number;
  estimatedClaudeCostUsd: number;
};

/** Filters out any place already represented in ExploreListing, in any review state. */
async function excludeKnownPlaceIds<T extends { placeId: string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const existing = await db.exploreListing.findMany({
    where: { googlePlaceId: { in: items.map((i) => i.placeId) } },
    select: { googlePlaceId: true },
  });
  const known = new Set(existing.map((e) => e.googlePlaceId));
  return items.filter((i) => !known.has(i.placeId));
}

/**
 * Cheap candidate search + dedup only — no Place Details, no scraping, no
 * Claude calls. Text Search doesn't return rating/review count at all, so
 * minRating/minReviewCount can't be applied here; they're only checkable
 * once runDiscovery fetches each candidate's Place Details.
 */
export async function previewDiscovery(params: DiscoveryParams): Promise<PreviewResult> {
  const results = await searchPlaces(params.area);
  const surviving = await excludeKnownPlaceIds(
    results.map((r) => ({ placeId: r.placeId, name: r.name, address: r.formattedAddress }))
  );

  const count = surviving.length;
  const estimatedGoogleCostUsd = count * PLACE_DETAILS_ENTERPRISE_PRICE_USD;
  const estimatedClaudeCostUsd =
    count *
    ((ASSUMED_INPUT_TOKENS / 1_000_000) * CLAUDE_INPUT_PRICE_PER_MTOK +
      (ASSUMED_OUTPUT_TOKENS / 1_000_000) * CLAUDE_OUTPUT_PRICE_PER_MTOK);

  return {
    candidates: surviving.map((s) => ({ placeId: s.placeId, name: s.name, address: s.address })),
    estimatedGoogleCostUsd,
    estimatedClaudeCostUsd,
  };
}

export type RunResult = {
  created: number;
  skipped: number;
  errors: { place: string; error: string }[];
};

/**
 * The real run. Processes candidates sequentially (not in parallel) — this
 * bounds one run's wall-clock duration and respects the website scraper's
 * per-domain rate limiting. Each draft is written to the database the
 * moment it's generated, not batched at the end, so a request cut off by a
 * platform timeout still leaves completed drafts behind.
 */
export async function runDiscovery(params: DiscoveryParams & { cap: number }): Promise<RunResult> {
  const results = await searchPlaces(params.area);
  const surviving = await excludeKnownPlaceIds(
    results.map((r) => ({ placeId: r.placeId, name: r.name }))
  );

  let created = 0;
  let skipped = 0;
  const errors: { place: string; error: string }[] = [];

  for (const candidate of surviving) {
    if (created >= params.cap) break;

    try {
      const details = await getPlaceDetails(candidate.placeId);

      if (
        (params.minRating !== null && (details.rating ?? 0) < params.minRating) ||
        (params.minReviewCount !== null && (details.reviewCount ?? 0) < params.minReviewCount)
      ) {
        skipped++;
        continue;
      }

      let sources: { url: string; text: string }[] = [];
      let noWebsiteNote: string | null = null;
      if (details.websiteUri) {
        const pages = await scrapeWebsite(details.websiteUri);
        sources = pages.map((p) => ({ url: p.url, text: p.text }));
        if (sources.length === 0) {
          noWebsiteNote = "The official website could not be read (robots.txt, timeout, or no matching pages) — based on Google Places data only.";
        }
      } else {
        noWebsiteNote = "No official website was available — based on Google Places data only.";
      }

      const content = await generateListingContent({
        name: details.name,
        vertical: params.vertical,
        formattedAddress: details.formattedAddress,
        neighborhood: details.neighborhood,
        priceLevel: details.priceLevel,
        rating: details.rating,
        reviewCount: details.reviewCount,
        cuisine: params.vertical === "DINE" ? details.primaryTypeLabel : null,
        sources,
      });

      const uncertainClaims = noWebsiteNote ? [noWebsiteNote, ...content.uncertainClaims] : content.uncertainClaims;

      const name = details.name;
      const slug = await uniqueExploreSlug(slugify(name));

      await db.exploreListing.create({
        data: {
          vertical: params.vertical,
          name,
          slug,
          description: content.shortDescription,
          longDescription: content.longDescription,
          neighborhood: details.neighborhood,
          priceLevel: details.priceLevel ?? 2,
          cuisine: params.vertical === "DINE" ? details.primaryTypeLabel : null,
          active: false,
          reviewStatus: "PENDING_REVIEW",
          googlePlaceId: details.placeId,
          googleFormattedAddress: details.formattedAddress,
          googleRating: details.rating,
          googleReviewCount: details.reviewCount,
          googleLastSyncedAt: new Date(),
          aiSourceUrls: sources.map((s) => s.url),
          aiUncertainClaims: uncertainClaims,
          aiGeneratedAt: new Date(),
        },
      });
      created++;
    } catch (err) {
      errors.push({ place: candidate.name, error: String(err) });
    }
  }

  return { created, skipped, errors };
}
