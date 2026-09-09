import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { VerticalBadge, StatusBadge } from "@/components/badges";
import { StatusSelect } from "@/components/status-select";
import { OptionPhoto } from "@/components/option-photo";
import { commissionRateFor } from "@/lib/partners";
import { getExploreSignal } from "@/lib/explore";
import { priceLevelLabel } from "@/lib/price-level";
import {
  addPartnerContact,
  deletePartnerContact,
  addShortlistOption,
  deleteShortlistOption,
  markShortlistReady,
  clearSelection,
  logOutcome,
} from "@/actions/admin-requests";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const request = await db.request.findUnique({
    where: { id },
    include: {
      customer: true,
      stayDetails: true,
      diningDetails: true,
      partnerContacts: { include: { partner: true }, orderBy: { createdAt: "desc" } },
      shortlistOptions: { include: { partner: true }, orderBy: { sortOrder: "asc" } },
      selectedOption: true,
      finalPartner: true,
    },
  });

  if (!request) notFound();

  const [otherRequests, partners, exploreSignal] = await Promise.all([
    db.request.findMany({
      where: { customerId: request.customerId, NOT: { id: request.id } },
      orderBy: { createdAt: "desc" },
    }),
    db.partner.findMany({
      where: { vertical: request.vertical === "STAY" ? "HOTEL" : "RESTAURANT" },
      orderBy: { name: "asc" },
    }),
    getExploreSignal(request.customerId, request.vertical),
  ]);

  const accent = request.vertical === "STAY" ? "var(--color-stay)" : "var(--color-dine)";
  const commissionRate = commissionRateFor(request.vertical === "STAY" ? "HOTEL" : "RESTAURANT");

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <Link href="/admin/requests" className="text-sm text-muted hover:text-ink-soft">
        ← All requests
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <VerticalBadge vertical={request.vertical} />
            <StatusBadge status={request.status} />
          </div>
          <h1 className="mt-3 font-serif text-h1 text-ink">
            <Link href={`/admin/customers/${request.customerId}`} className="hover:underline">
              {request.customer.name}
            </Link>
          </h1>
          <p className="mt-2 text-ink-soft">
            {request.city} · received {formatDateTime(request.createdAt)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {request.customer.email ?? "no email"} · {request.customer.phone ?? "no phone"}
          </p>
        </div>
        <div>
          <p className="field-label">Status</p>
          <StatusSelect requestId={request.id} status={request.status} />
        </div>
      </div>

      {otherRequests.length > 0 && (
        <p className="mt-5 rounded-xl bg-paper-alt px-5 py-3.5 text-sm text-ink-soft">
          This customer has {otherRequests.length} other request{otherRequests.length === 1 ? "" : "s"}:{" "}
          {otherRequests.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <Link href={`/admin/requests/${r.id}`} className="font-medium hover:underline">
                {r.vertical === "STAY" ? "Wannago" : "Wanna Eats"} · {formatDate(r.createdAt)}
              </Link>
            </span>
          ))}
        </p>
      )}

      {exploreSignal && (
        <div className="mt-5 rounded-xl bg-paper-alt px-5 py-3.5 text-sm text-ink-soft">
          <span className="font-medium text-ink">Liked on Explore: </span>
          {exploreSignal.likedListingNames.join(", ")}
          {exploreSignal.tags.length > 0 && <> — {exploreSignal.tags.join(", ")}</>}
          {exploreSignal.priceLevelMin !== null && (
            <>
              {" "}
              ·{" "}
              {exploreSignal.priceLevelMin === exploreSignal.priceLevelMax
                ? priceLevelLabel(exploreSignal.priceLevelMin)
                : `${priceLevelLabel(exploreSignal.priceLevelMin)}-${priceLevelLabel(exploreSignal.priceLevelMax!)}`}
            </>
          )}
        </div>
      )}

      {request.selectedOption && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EAD9C3] px-5 py-3.5 text-sm">
          <p className="text-stay-strong">
            Customer selected <span className="font-medium">{request.selectedOption.name}</span>
            {request.selectedAt && ` on ${formatDate(request.selectedAt)}`} — go finalize this booking.
          </p>
          <form action={clearSelection.bind(null, request.id)}>
            <button type="submit" className="text-stay-strong underline hover:opacity-75">
              Clear selection
            </button>
          </form>
        </div>
      )}

      <section className="card mt-10">
        <h2 className="font-serif text-h2 text-ink">The request</h2>
        {request.vertical === "STAY" && request.stayDetails && (
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Detail label="Check-in" value={formatDate(request.stayDetails.checkIn)} />
            <Detail label="Check-out" value={formatDate(request.stayDetails.checkOut)} />
            <Detail label="Guests" value={String(request.stayDetails.guests)} />
            <Detail label="Budget / night" value={formatMoney(request.stayDetails.budgetPerNight)} />
            <Detail
              label="Preferences"
              value={
                request.stayDetails.preferenceTags.length > 0
                  ? request.stayDetails.preferenceTags.join(", ")
                  : "—"
              }
              wide
            />
          </dl>
        )}
        {request.vertical === "DINE" && request.diningDetails && (
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Detail label="Date" value={formatDate(request.diningDetails.date)} />
            <Detail label="Time" value={request.diningDetails.time} />
            <Detail label="Party size" value={String(request.diningDetails.partySize)} />
            <Detail label="Budget / person" value={formatMoney(request.diningDetails.budgetPerPerson)} />
            <Detail label="Occasion" value={request.diningDetails.occasion ?? "—"} />
            <Detail label="Cuisine" value={request.diningDetails.cuisine ?? "—"} />
            <Detail label="Dietary needs" value={request.diningDetails.dietaryNeeds ?? "—"} wide />
          </dl>
        )}
        {request.consumerNotes && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="field-label">Notes from the customer</p>
            <p className="whitespace-pre-wrap text-ink-soft">{request.consumerNotes}</p>
          </div>
        )}
      </section>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Partners contacted</h2>
        <p className="mt-1 text-sm text-muted">Who you reached out to, and what they quoted.</p>

        <ul className="mt-5 space-y-3">
          {request.partnerContacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-4 rounded-xl bg-paper-alt/60 px-5 py-4">
              <div>
                <p className="font-medium text-ink">{c.partner?.name ?? c.partnerNameIfUnlisted}</p>
                <p className="text-sm text-ink-soft">
                  {c.quote !== null ? `Quoted ${formatMoney(c.quote)}` : "No quote logged"} · {formatDate(c.createdAt)}
                </p>
                {c.notes && <p className="mt-1 text-sm text-ink-soft">{c.notes}</p>}
              </div>
              <form action={deletePartnerContact.bind(null, request.id, c.id)}>
                <button type="submit" className="text-sm text-muted hover:text-danger">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {request.partnerContacts.length === 0 && (
            <p className="text-sm text-muted">No partners logged yet.</p>
          )}
        </ul>

        <form action={addPartnerContact.bind(null, request.id)} className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pc-partnerId">Existing partner</label>
            <select id="pc-partnerId" name="partnerId" className="field-input">
              <option value="">— pick one —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="pc-partnerNameIfUnlisted">Or a partner not yet in the list</label>
            <input id="pc-partnerNameIfUnlisted" name="partnerNameIfUnlisted" type="text" className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="pc-quote">Quote</label>
            <input id="pc-quote" name="quote" type="number" step="0.01" className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="pc-notes">Notes</label>
            <input id="pc-notes" name="notes" type="text" className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Log contact</button>
          </div>
        </form>
      </section>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Shortlist sent to the customer</h2>
        <p className="mt-1 text-sm text-muted">
          {request.vertical === "STAY" ? "Up to ~5 options." : "Usually just the one recommendation."}
        </p>

        <ul className="mt-5 space-y-3">
          {request.shortlistOptions.map((o) => (
            <li key={o.id} className="flex items-start gap-4 rounded-xl bg-paper-alt/60 p-4">
              <OptionPhoto
                src={o.photoUrl}
                alt={o.name}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{o.name}</p>
                  <form action={deleteShortlistOption.bind(null, request.id, o.id)}>
                    <button type="submit" className="shrink-0 text-sm text-muted hover:text-danger">
                      Remove
                    </button>
                  </form>
                </div>
                <p className="text-sm text-ink-soft">{o.price !== null ? formatMoney(o.price) : "No price logged"}</p>
                {o.notes && <p className="mt-1 text-sm text-ink-soft">{o.notes}</p>}
              </div>
            </li>
          ))}
          {request.shortlistOptions.length === 0 && (
            <p className="text-sm text-muted">Nothing added to the shortlist yet.</p>
          )}
        </ul>

        <form action={addShortlistOption.bind(null, request.id)} className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="so-partnerId">Link to a partner (optional)</label>
            <select id="so-partnerId" name="partnerId" className="field-input">
              <option value="">— none —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="so-name">Name to show the customer</label>
            <input id="so-name" name="name" type="text" required className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="so-price">Price</label>
            <input id="so-price" name="price" type="number" step="0.01" className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="so-notes">Notes</label>
            <input id="so-notes" name="notes" type="text" className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="so-photo">Photo</label>
            <input
              id="so-photo"
              name="photo"
              type="file"
              accept="image/*"
              className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-paper-alt file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
            />
            <p className="field-hint">JPG or PNG, up to 5MB.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="so-photoUrl">Or paste a photo URL instead</label>
            <input id="so-photoUrl" name="photoUrl" type="url" placeholder="https://..." className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-secondary">Add to shortlist</button>
          </div>
        </form>

        {request.shortlistOptions.length > 0 && (
          <form action={markShortlistReady.bind(null, request.id)} className="mt-6 border-t border-line pt-6">
            <button type="submit" className="btn-primary">
              Mark ready &amp; notify customer
            </button>
            <p className="mt-2 text-xs text-muted">
              Emails the customer a link to view and select from the options above.
            </p>
          </form>
        )}
      </section>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Final outcome</h2>
        <p className="mt-1 text-sm text-muted">
          Your own record for monthly partner invoicing — {Math.round(commissionRate * 100)}% commission on this
          vertical.
        </p>

        {request.closedAt && (
          <p className="mt-3 text-sm text-ink-soft">Last saved {formatDateTime(request.closedAt)}</p>
        )}

        <form action={logOutcome.bind(null, request.id)} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="fo-finalPartnerId">Booked with (existing partner)</label>
            <select
              id="fo-finalPartnerId"
              name="finalPartnerId"
              defaultValue={request.finalPartnerId ?? ""}
              className="field-input"
            >
              <option value="">— pick one —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="fo-finalPartnerNameIfUnlisted">Or a partner not yet in the list</label>
            <input
              id="fo-finalPartnerNameIfUnlisted"
              name="finalPartnerNameIfUnlisted"
              type="text"
              defaultValue={request.finalPartnerNameIfUnlisted ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="fo-finalPrice">Confirmed price</label>
            <input
              id="fo-finalPrice"
              name="finalPrice"
              type="number"
              step="0.01"
              defaultValue={request.finalPrice !== null ? Number(request.finalPrice) : undefined}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="fo-outcomeNotes">Notes</label>
            <input
              id="fo-outcomeNotes"
              name="outcomeNotes"
              type="text"
              defaultValue={request.outcomeNotes ?? ""}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Save outcome</button>
            <p className="mt-2 text-xs text-muted">
              Remember to also set status to Booked or Closed / lost above — this only saves the outcome details.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
