"use server";

import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getDiscoverySettings, SETTINGS_ID } from "@/lib/discovery-settings";

function positiveInt(formData: FormData, key: string): number | null {
  const n = Number(formData.get(key));
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function updateDiscoverySettings(formData: FormData): Promise<void> {
  await requireAdmin();

  const dailyPlaceLimit = positiveInt(formData, "dailyPlaceLimit");
  const monthlyPlaceLimit = positiveInt(formData, "monthlyPlaceLimit");
  const maxCapPerRun = positiveInt(formData, "maxCapPerRun");
  const cronRateLimitPerHour = positiveInt(formData, "cronRateLimitPerHour");
  const killSwitchEnabled = formData.get("killSwitchEnabled") === "on";

  // Whole-submission no-op if any field is invalid — same convention as
  // the rest of this app's admin forms.
  if (!dailyPlaceLimit || !monthlyPlaceLimit || !maxCapPerRun || !cronRateLimitPerHour) return;

  await getDiscoverySettings(); // ensure the row exists
  await db.discoverySettings.update({
    where: { id: SETTINGS_ID },
    data: { dailyPlaceLimit, monthlyPlaceLimit, maxCapPerRun, cronRateLimitPerHour, killSwitchEnabled },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function toggleKillSwitch(next: boolean): Promise<void> {
  await requireAdmin();
  await getDiscoverySettings();
  await db.discoverySettings.update({ where: { id: SETTINGS_ID }, data: { killSwitchEnabled: next } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export type RotateSecretResult = { ok: true; plaintextSecret: string } | { ok: false; error: string };

export async function rotateDiscoveryCronSecret(): Promise<RotateSecretResult> {
  await requireAdmin();

  const plaintextSecret = randomBytes(32).toString("base64");
  const cronSecretHash = createHash("sha256").update(plaintextSecret).digest("hex");

  await getDiscoverySettings();
  await db.discoverySettings.update({
    where: { id: SETTINGS_ID },
    data: { cronSecretHash, cronSecretUpdatedAt: new Date() },
  });

  revalidatePath("/admin/settings");
  return { ok: true, plaintextSecret };
}
