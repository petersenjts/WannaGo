import { getDiscoverySettings } from "@/lib/discovery-settings";
import { updateDiscoverySettings } from "@/actions/discovery-settings";
import { RotateCronSecretButton } from "@/components/admin/rotate-cron-secret-button";

// Same reasoning as the dashboard page — no searchParams/cookies() here for
// Next to detect as dynamic, so force it rather than risk a stale,
// build-time-only snapshot of settings being served.
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getDiscoverySettings();

  return (
    <div>
      <h1 className="font-serif text-h1 text-ink">Settings</h1>
      <p className="mt-2 text-ink-soft">Spend limits and controls for the AI discovery agent.</p>

      <section className="card mt-8 max-w-2xl">
        <h2 className="font-serif text-h2 text-ink">Limits</h2>
        <form action={updateDiscoverySettings} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="dailyPlaceLimit">Daily place limit</label>
            <input
              id="dailyPlaceLimit"
              name="dailyPlaceLimit"
              type="number"
              min="1"
              defaultValue={settings.dailyPlaceLimit}
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="monthlyPlaceLimit">Monthly place limit</label>
            <input
              id="monthlyPlaceLimit"
              name="monthlyPlaceLimit"
              type="number"
              min="1"
              defaultValue={settings.monthlyPlaceLimit}
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="maxCapPerRun">Max places per run</label>
            <input
              id="maxCapPerRun"
              name="maxCapPerRun"
              type="number"
              min="1"
              defaultValue={settings.maxCapPerRun}
              className="field-input [--accent:var(--color-ink)]"
            />
            <p className="field-hint">A very high cap risks a platform timeout partway through one run.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="cronRateLimitPerHour">Scheduled runs allowed per hour</label>
            <input
              id="cronRateLimitPerHour"
              name="cronRateLimitPerHour"
              type="number"
              min="1"
              defaultValue={settings.cronRateLimitPerHour}
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="tag-chip inline-flex items-center gap-2">
              <input type="checkbox" name="killSwitchEnabled" defaultChecked={settings.killSwitchEnabled} />
              Kill switch — block all automated runs (admin button and the scheduled route) immediately
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Save settings</button>
          </div>
        </form>
      </section>

      <section className="card mt-8 max-w-2xl">
        <h2 className="font-serif text-h2 text-ink">Scheduled run secret</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Your external scheduler (e.g. a GitHub Actions cron workflow) authenticates to{" "}
          <code>POST /api/discovery/run</code> with this secret as the <code>x-discovery-secret</code> header.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {settings.cronSecretHash
            ? `A secret is configured${settings.cronSecretUpdatedAt ? ` (last rotated ${settings.cronSecretUpdatedAt.toLocaleDateString()})` : ""}.`
            : "No secret configured yet — the scheduled route will refuse all requests until you generate one."}
        </p>
        <div className="mt-4">
          <RotateCronSecretButton />
        </div>
      </section>
    </div>
  );
}
