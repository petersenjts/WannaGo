"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { previewDiscovery, type DiscoveryParams } from "@/lib/discovery-pipeline";
import { runDiscoveryWithSafeguards } from "@/lib/discovery-safeguards";
import type { ClaimCheck } from "@/lib/claude-verification";
import type { Vertical } from "@prisma/client";

const BLOCKED_MESSAGES: Record<string, string> = {
  KILL_SWITCH: "Blocked — the kill switch is on. Turn it off in Settings to run discovery.",
  DAILY_LIMIT: "Blocked — today's place limit has been reached. Adjust it in Settings if needed.",
  MONTHLY_LIMIT: "Blocked — this month's place limit has been reached. Adjust it in Settings if needed.",
};

function parseParams(formData: FormData): DiscoveryParams {
  const area = String(formData.get("area") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "") === "DINE" ? "DINE" : ("STAY" as Vertical);
  const minRatingRaw = String(formData.get("minRating") ?? "").trim();
  const minReviewCountRaw = String(formData.get("minReviewCount") ?? "").trim();
  return {
    area,
    vertical,
    minRating: minRatingRaw ? Number(minRatingRaw) : null,
    minReviewCount: minReviewCountRaw ? Number(minReviewCountRaw) : null,
  };
}

export type PreviewDiscoveryResult =
  | { ok: true; candidates: { placeId: string; name: string; address: string }[]; estimatedGoogleCostUsd: number; estimatedClaudeCostUsd: number }
  | { ok: false; error: string };

export async function previewDiscoveryAction(formData: FormData): Promise<PreviewDiscoveryResult> {
  await requireAdmin();
  const params = parseParams(formData);
  if (!params.area) return { ok: false, error: "Enter an area to search." };

  try {
    const result = await previewDiscovery(params);
    return { ok: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Discovery preview failed:", err);
    // Preview doesn't write to DiscoveryRunLog (it's a deliberately
    // cheap/no-DB-write dry run) — the real error can only be surfaced here,
    // live, rather than also persisted for later viewing.
    return { ok: false, error: message };
  }
}

export type RunDiscoveryResult =
  | { ok: true; created: number; skipped: number; errors: { place: string; error: string }[] }
  | { ok: false; error: string };

export async function runDiscoveryAction(formData: FormData): Promise<RunDiscoveryResult> {
  await requireAdmin();
  const params = parseParams(formData);
  if (!params.area) return { ok: false, error: "Enter an area to search." };

  const capRaw = Number(formData.get("cap"));
  const cap = Number.isInteger(capRaw) && capRaw > 0 ? capRaw : 10;

  try {
    const result = await runDiscoveryWithSafeguards({ ...params, cap }, "ADMIN");
    revalidatePath("/admin/explore");
    revalidatePath("/admin");
    if (!result.ok) {
      if ("failed" in result) {
        return { ok: false, error: result.failed.message };
      }
      return { ok: false, error: BLOCKED_MESSAGES[result.blocked.reason] ?? "Blocked by a spend safeguard." };
    }
    return { ok: true, created: result.created, skipped: result.skipped, errors: result.errors };
  } catch (err) {
    console.error("Discovery run failed:", err);
    return { ok: false, error: "The discovery run failed partway through — check the server logs." };
  }
}

export async function approveDraftListing(listingId: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const listing = await db.exploreListing.findUnique({ where: { id: listingId } });
  if (!listing) return;

  const claimChecks = Array.isArray(listing.aiClaimChecks) ? (listing.aiClaimChecks as unknown as ClaimCheck[]) : [];
  const hasUnsupportedClaims = claimChecks.some((c) => !c.supported);
  const textEdited =
    listing.description !== listing.aiOriginalDescription ||
    listing.longDescription !== listing.aiOriginalLongDescription;
  const override = formData.get("override") === "on";

  // Blocked — a draft with unsupported claims can't be approved until it's
  // been edited (text no longer matches what was flagged) or the admin
  // explicitly overrides. Client-side the button is already disabled for
  // this case; this is defense-in-depth, so it silently no-ops rather than
  // surfacing an error, matching this file's existing convention for
  // invalid/blocked bound-form actions.
  if (hasUnsupportedClaims && !textEdited && !override) return;

  await db.exploreListing.update({
    where: { id: listingId },
    data: {
      reviewStatus: null,
      active: true,
      approvedWithOverride: hasUnsupportedClaims && !textEdited && override,
    },
  });
  revalidatePath("/admin/explore");
  revalidatePath(`/admin/explore/${listingId}`);
}

export async function rejectDraftListing(listingId: string): Promise<void> {
  await requireAdmin();
  await db.exploreListing.update({
    where: { id: listingId },
    data: { reviewStatus: "REJECTED", active: false },
  });
  revalidatePath("/admin/explore");
  revalidatePath(`/admin/explore/${listingId}`);
}
