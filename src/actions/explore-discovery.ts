"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { previewDiscovery, runDiscovery, type DiscoveryParams } from "@/lib/discovery-pipeline";
import type { Vertical } from "@prisma/client";

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
    console.error("Discovery preview failed:", err);
    return { ok: false, error: "Couldn't reach Google — try again in a moment." };
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
  const cap = Number.isInteger(capRaw) && capRaw > 0 ? Math.min(capRaw, 30) : 10;

  try {
    const result = await runDiscovery({ ...params, cap });
    revalidatePath("/admin/explore");
    revalidatePath("/admin");
    return { ok: true, created: result.created, skipped: result.skipped, errors: result.errors };
  } catch (err) {
    console.error("Discovery run failed:", err);
    return { ok: false, error: "The discovery run failed partway through — check the server logs." };
  }
}

export async function approveDraftListing(listingId: string): Promise<void> {
  await requireAdmin();
  await db.exploreListing.update({
    where: { id: listingId },
    data: { reviewStatus: null, active: true },
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
