import Link from "next/link";
import { db } from "@/lib/db";
import { TrialBadge } from "@/components/badges";
import { createPartner } from "@/actions/admin-partners";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical: verticalParam } = await searchParams;
  const vertical = verticalParam === "HOTEL" || verticalParam === "RESTAURANT" ? verticalParam : undefined;

  const partners = await db.partner.findMany({
    where: vertical ? { vertical } : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-h1 text-ink">Partners</h1>
      <p className="mt-2 text-ink-soft">Hotels and restaurants you work with — contact info and trial status.</p>

      <form className="mt-8 flex gap-3" method="get">
        <select name="vertical" defaultValue={vertical ?? ""} className="field-input w-auto [--accent:var(--color-ink)]">
          <option value="">All verticals</option>
          <option value="HOTEL">Hotels</option>
          <option value="RESTAURANT">Restaurants</option>
        </select>
        <button type="submit" className="btn-primary [--accent:var(--color-ink)]">
          Filter
        </button>
      </form>

      <div className="mt-10 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="eyebrow">
            <tr>
              <th className="px-5 py-4 font-medium">Name</th>
              <th className="px-5 py-4 font-medium">Vertical</th>
              <th className="px-5 py-4 font-medium">City</th>
              <th className="px-5 py-4 font-medium">Contact</th>
              <th className="px-5 py-4 font-medium">Commission status</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="even:bg-paper-alt/40 hover:bg-paper-alt">
                <td className="px-5 py-4 align-top">
                  <Link href={`/admin/partners/${p.id}`} className="font-medium text-ink hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-5 py-4 align-top text-ink-soft">
                  {p.vertical === "HOTEL" ? "Hotel" : "Restaurant"}
                </td>
                <td className="px-5 py-4 align-top text-ink-soft">{p.city}</td>
                <td className="px-5 py-4 align-top text-ink-soft">{p.contactInfo ?? "—"}</td>
                <td className="px-5 py-4 align-top">
                  <TrialBadge trialStartDate={p.trialStartDate} />
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted">
                  No partners yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="card mt-12 max-w-2xl">
        <h2 className="font-serif text-h2 text-ink">Add a partner</h2>
        <form action={createPartner} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="p-name">Name</label>
            <input id="p-name" name="name" type="text" required className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="p-vertical">Vertical</label>
            <select id="p-vertical" name="vertical" required className="field-input [--accent:var(--color-ink)]">
              <option value="HOTEL">Hotel</option>
              <option value="RESTAURANT">Restaurant</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-city">City</label>
            <input id="p-city" name="city" type="text" required className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="p-contactInfo">Contact info</label>
            <input id="p-contactInfo" name="contactInfo" type="text" placeholder="Email, phone, WhatsApp..." className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="p-trialStartDate">Trial start date</label>
            <input
              id="p-trialStartDate"
              name="trialStartDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="p-notes">Notes</label>
            <textarea id="p-notes" name="notes" rows={3} className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary [--accent:var(--color-ink)]">
              Add partner
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
