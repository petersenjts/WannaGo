import { db } from "@/lib/db";
import { getDiscoverySettings } from "@/lib/discovery-settings";
import {
  runDiscovery,
  type DiscoveryParams,
  PLACE_DETAILS_ENTERPRISE_PRICE_USD,
  CLAUDE_INPUT_PRICE_PER_MTOK,
  CLAUDE_OUTPUT_PRICE_PER_MTOK,
} from "@/lib/discovery-pipeline";
import type { DiscoveryBlockedReason, DiscoveryTrigger } from "@prisma/client";

export type SafeguardedRunResult =
  | { ok: true; created: number; skipped: number; errors: { place: string; error: string }[] }
  | { ok: false; blocked: { reason: DiscoveryBlockedReason } }
  | { ok: false; failed: { message: string } };

// Keeps a pathological error body (e.g. a large HTML error page) from
// bloating the run log indefinitely.
const MAX_ERROR_MESSAGE_LENGTH = 2000;

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function logBlockedRun(
  params: { area: string; vertical: DiscoveryParams["vertical"] },
  trigger: DiscoveryTrigger,
  reason: DiscoveryBlockedReason
): Promise<void> {
  await db.discoveryRunLog.create({
    data: {
      trigger,
      area: params.area,
      vertical: params.vertical,
      blockedReason: reason,
      finishedAt: new Date(),
    },
  });
}

/**
 * The layer both trigger points (the admin button and the cron route) call
 * through — runDiscovery itself stays a pure, unguarded primitive. Checks
 * the kill switch and daily/monthly place limits before any Google/Claude
 * call is made, then logs the outcome either way (including a blocked
 * attempt, so the dashboard's recent-runs list shows refusals too).
 */
export async function runDiscoveryWithSafeguards(
  params: DiscoveryParams & { cap: number },
  trigger: DiscoveryTrigger
): Promise<SafeguardedRunResult> {
  const settings = await getDiscoverySettings();

  if (settings.killSwitchEnabled) {
    await logBlockedRun(params, trigger, "KILL_SWITCH");
    return { ok: false, blocked: { reason: "KILL_SWITCH" } };
  }

  const [dayAgg, monthAgg] = await Promise.all([
    db.discoveryRunLog.aggregate({
      _sum: { placesCreated: true },
      where: { startedAt: { gte: startOfDay() }, blockedReason: null },
    }),
    db.discoveryRunLog.aggregate({
      _sum: { placesCreated: true },
      where: { startedAt: { gte: startOfMonth() }, blockedReason: null },
    }),
  ]);

  const dailyRemaining = settings.dailyPlaceLimit - (dayAgg._sum.placesCreated ?? 0);
  const monthlyRemaining = settings.monthlyPlaceLimit - (monthAgg._sum.placesCreated ?? 0);
  const effectiveCap = Math.min(params.cap, settings.maxCapPerRun, dailyRemaining, monthlyRemaining);

  if (effectiveCap <= 0) {
    const reason: DiscoveryBlockedReason = dailyRemaining <= 0 ? "DAILY_LIMIT" : "MONTHLY_LIMIT";
    await logBlockedRun(params, trigger, reason);
    return { ok: false, blocked: { reason } };
  }

  const startedAt = new Date();
  let result: Awaited<ReturnType<typeof runDiscovery>>;
  try {
    result = await runDiscovery({ ...params, cap: effectiveCap });
  } catch (err) {
    // The search itself failed before any candidate could be processed
    // (invalid key, API not enabled, a restricted key rejecting server-side
    // calls, etc.) — logged here, with the real message, instead of only
    // reaching console/Railway logs while the run log shows nothing.
    const message = (err instanceof Error ? err.message : String(err)).slice(0, MAX_ERROR_MESSAGE_LENGTH);
    await db.discoveryRunLog.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        trigger,
        area: params.area,
        vertical: params.vertical,
        errorMessage: message,
      },
    });
    return { ok: false, failed: { message } };
  }

  const estimatedCostUsd =
    result.googleCallCount * PLACE_DETAILS_ENTERPRISE_PRICE_USD +
    (result.claudeInputTokens / 1_000_000) * CLAUDE_INPUT_PRICE_PER_MTOK +
    (result.claudeOutputTokens / 1_000_000) * CLAUDE_OUTPUT_PRICE_PER_MTOK;

  await db.discoveryRunLog.create({
    data: {
      startedAt,
      finishedAt: new Date(),
      trigger,
      area: params.area,
      vertical: params.vertical,
      placesCreated: result.created,
      placesSkipped: result.skipped,
      errorCount: result.errors.length,
      googleCallCount: result.googleCallCount,
      claudeInputTokens: result.claudeInputTokens,
      claudeOutputTokens: result.claudeOutputTokens,
      estimatedCostUsd,
    },
  });

  return { ok: true, created: result.created, skipped: result.skipped, errors: result.errors };
}
