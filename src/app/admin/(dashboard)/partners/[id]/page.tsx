import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { commissionRateFor, trialEndDate } from "@/lib/partners";
import { TrialBadge } from "@/components/badges";
import { updatePartner } from "@/actions/admin-partners";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const partner = await db.partner.findUnique({
    where: { id },
    include: {
      bookedRequests: { include: { customer: true }, orderBy: { closedAt: "desc" } },
      contactedFor: { include: { request: { include: { customer: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!partner) notFound();

  const rate = commissionRateFor(partner.vertical);
  const totalCommission = partner.bookedRequests.reduce((sum, r) => {
    return sum + (r.finalPrice ? Number(r.finalPrice) * rate : 0);
  }, 0);

  return (
    <div>
      <Link href="/admin/partners" className="text-sm text-muted hover:text-ink-soft">
        ← All partners
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            {partner.vertical === "HOTEL" ? "Hotel" : "Restaurant"}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">{partner.name}</h1>
          <p className="mt-1 text-ink-soft">{partner.city}</p>
        </div>
        <TrialBadge trialStartDate={partner.trialStartDate} />
      </div>

      <section className="mt-8 max-w-2xl rounded-xl border border-line bg-card p-6">
        <h2 className="font-serif text-xl text-ink">Details</h2>
        <form action={updatePartner.bind(null, partner.id)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="name">Name</label>
            <input id="name" name="name" type="text" defaultValue={partner.name} required className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="city">City</label>
            <input id="city" name="city" type="text" defaultValue={partner.city} required className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="contactInfo">Contact info</label>
            <input id="contactInfo" name="contactInfo" type="text" defaultValue={partner.contactInfo ?? ""} className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="trialStartDate">Trial start date</label>
            <input
              id="trialStartDate"
              name="trialStartDate"
              type="date"
              defaultValue={partner.trialStartDate.toISOString().slice(0, 10)}
              className="field-input [--accent:var(--color-ink)]"
            />
            <p className="field-hint">Trial ends {formatDate(trialEndDate(partner.trialStartDate))}, then {Math.round(rate * 100)}% commission applies.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={partner.notes ?? ""} className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary [--accent:var(--color-ink)]">Save changes</button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-xl border border-line bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-ink">Bookings</h2>
          <p className="text-sm text-ink-soft">
            {partner.bookedRequests.length} booking{partner.bookedRequests.length === 1 ? "" : "s"} · est. commission{" "}
            {formatMoney(totalCommission)}
          </p>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {partner.bookedRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <Link href={`/admin/requests/${r.id}`} className="font-medium text-ink hover:underline">
                  {r.customer.name}
                </Link>
                <p className="text-sm text-muted">{r.closedAt ? formatDate(r.closedAt) : "—"}</p>
              </div>
              <p className="text-ink-soft">{r.finalPrice !== null ? formatMoney(r.finalPrice) : "—"}</p>
            </li>
          ))}
          {partner.bookedRequests.length === 0 && (
            <p className="py-3 text-sm text-muted">No bookings logged for this partner yet.</p>
          )}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-line bg-card p-6">
        <h2 className="font-serif text-xl text-ink">Contact history</h2>
        <ul className="mt-4 divide-y divide-line">
          {partner.contactedFor.map((c) => (
            <li key={c.id} className="py-3">
              <Link href={`/admin/requests/${c.requestId}`} className="font-medium text-ink hover:underline">
                {c.request.customer.name}
              </Link>
              <p className="text-sm text-muted">
                {formatDate(c.createdAt)} · {c.quote !== null ? `quoted ${formatMoney(c.quote)}` : "no quote"}
              </p>
              {c.notes && <p className="mt-1 text-sm text-ink-soft">{c.notes}</p>}
            </li>
          ))}
          {partner.contactedFor.length === 0 && (
            <p className="py-3 text-sm text-muted">No contact history yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
