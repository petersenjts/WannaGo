import Link from "next/link";
import { db } from "@/lib/db";
import { getDiscoverySettings } from "@/lib/discovery-settings";
import { toggleKillSwitch } from "@/actions/discovery-settings";

// No searchParams/cookies() on this page for Next to detect as a dynamic
// signal, so it would otherwise be statically rendered once at build time —
// wrong for a dashboard showing live cost/kill-switch/review-queue data.
export const dynamic = "force-dynamic";

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const BLOCKED_LABELS: Record<string, string> = {
  KILL_SWITCH: "Kill switch",
  DAILY_LIMIT: "Daily limit",
  MONTHLY_LIMIT: "Monthly limit",
  RATE_LIMIT: "Rate limit",
};

export default async function AdminDashboardPage() {
  const [settings, monthCost, pendingReviewCount, recentRuns] = await Promise.all([
    getDiscoverySettings(),
    db.discoveryRunLog.aggregate({
      _sum: { estimatedCostUsd: true },
      where: { startedAt: { gte: startOfMonth() } },
    }),
    db.exploreListing.count({ where: { reviewStatus: "PENDING_REVIEW" } }),
    db.discoveryRunLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
  ]);

  const costThisMonth = Number(monthCost._sum.estimatedCostUsd ?? 0);

  return (
    <div>
      <h1 className="font-serif text-h1 text-ink">Dashboard</h1>

      {settings.killSwitchEnabled && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger bg-danger/10 px-6 py-4">
          <p className="text-sm font-medium text-danger">
            The discovery kill switch is ON — all automated runs (admin button and the scheduled route) are blocked.
          </p>
          <form action={toggleKillSwitch.bind(null, false)}>
            <button type="submit" className="btn-secondary">Turn off</button>
          </form>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <p className="eyebrow">This month</p>
          <p className="mt-2 font-serif text-h2 text-ink">${costThisMonth.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted">Discovery agent spend (Google + Claude, estimated)</p>
        </div>
        <div className="card">
          <p className="eyebrow">Needs review</p>
          <p className="mt-2 font-serif text-h2 text-ink">{pendingReviewCount}</p>
          <Link href="/admin/explore?review=pending" className="mt-1 inline-block text-xs text-ink-soft hover:underline">
            Review drafts →
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">Kill switch</p>
          <p className="mt-2 font-serif text-h2 text-ink">{settings.killSwitchEnabled ? "On" : "Off"}</p>
          <Link href="/admin/settings" className="mt-1 inline-block text-xs text-ink-soft hover:underline">
            Settings →
          </Link>
        </div>
      </div>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Recent discovery runs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="eyebrow">
              <tr>
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Trigger</th>
                <th className="py-2 pr-4 font-medium">Area</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 pr-4 font-medium">Cost</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => (
                <tr key={run.id} className="even:bg-paper-alt/40">
                  <td className="py-2 pr-4 align-top text-ink-soft">{run.startedAt.toLocaleString()}</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">{run.trigger === "ADMIN" ? "Admin" : "Scheduled"}</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">{run.area}</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">{run.placesCreated}</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">${Number(run.estimatedCostUsd).toFixed(3)}</td>
                  <td className="py-2 pr-4 align-top">
                    {run.blockedReason ? (
                      <span className="inline-flex items-center rounded-full bg-[#F3E6C6] px-2.5 py-0.5 text-xs font-medium text-[#7A5A1E]">
                        Blocked — {BLOCKED_LABELS[run.blockedReason] ?? run.blockedReason}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#DCE3CE] px-2.5 py-0.5 text-xs font-medium text-dine-strong">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {recentRuns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No discovery runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
