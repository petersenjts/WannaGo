import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDiscoverySettings } from "@/lib/discovery-settings";
import { runDiscoveryWithSafeguards, logBlockedRun } from "@/lib/discovery-safeguards";
import type { Vertical } from "@prisma/client";

// Not covered by proxy.ts's matcher (admin/portal/explore only) — this route
// is deliberately outside the admin-session auth path, since it's called by
// an external scheduler with no browser involved. It authenticates itself
// with a shared secret (hashed, rotatable from Settings) instead.
export async function POST(request: NextRequest) {
  const settings = await getDiscoverySettings();
  if (!settings.cronSecretHash) {
    return NextResponse.json({ error: "No cron secret configured — generate one in Settings." }, { status: 500 });
  }

  const provided = request.headers.get("x-discovery-secret");
  if (!provided) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providedHash = createHash("sha256").update(provided).digest();
  const storedHash = Buffer.from(settings.cronSecretHash, "hex");
  const authorized = providedHash.length === storedHash.length && timingSafeEqual(providedHash, storedHash);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const area = typeof body.area === "string" && body.area ? body.area : "Amsterdam";
  const vertical: Vertical = body.vertical === "DINE" ? "DINE" : "STAY";
  const minRating = typeof body.minRating === "number" ? body.minRating : 4.0;
  const minReviewCount = typeof body.minReviewCount === "number" ? body.minReviewCount : 50;
  const cap = typeof body.cap === "number" && body.cap > 0 ? body.cap : 10;

  // Rate limit — bounds hits on the endpoint itself, distinct from the
  // daily/monthly *place* limits enforced inside runDiscoveryWithSafeguards.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCronRuns = await db.discoveryRunLog.count({
    where: { trigger: "CRON", startedAt: { gte: oneHourAgo } },
  });
  if (recentCronRuns >= settings.cronRateLimitPerHour) {
    await logBlockedRun({ area, vertical }, "CRON", "RATE_LIMIT");
    return NextResponse.json({ ok: false, blockedReason: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const result = await runDiscoveryWithSafeguards({ area, vertical, minRating, minReviewCount, cap }, "CRON");
    if (!result.ok) {
      return NextResponse.json({ ok: false, blockedReason: result.blocked.reason });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Scheduled discovery run failed:", err);
    return NextResponse.json({ error: "Discovery run failed" }, { status: 500 });
  }
}
