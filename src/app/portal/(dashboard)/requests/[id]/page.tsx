import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalSession } from "@/lib/portal-auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { customerStatusLabel } from "@/lib/portal-status";
import { SelectOptionButton } from "@/components/select-option-button";
import { OptionPhoto } from "@/components/option-photo";

export default async function PortalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await getPortalSession();
  if (!email) return null; // proxy.ts already guards this route

  const request = await db.request.findUnique({
    where: { id },
    include: {
      customer: true,
      stayDetails: true,
      diningDetails: true,
      shortlistOptions: { orderBy: { sortOrder: "asc" } },
      selectedOption: true,
    },
  });

  // Ownership check — a request only belongs to the signed-in customer.
  if (!request || request.customer.email !== email) notFound();

  const accent = request.vertical === "STAY" ? "var(--color-stay)" : "var(--color-dine)";

  const summary =
    request.vertical === "STAY" && request.stayDetails
      ? `${formatDate(request.stayDetails.checkIn)} → ${formatDate(request.stayDetails.checkOut)} · ${request.stayDetails.guests} guests`
      : request.vertical === "DINE" && request.diningDetails
        ? `${formatDate(request.diningDetails.date)} at ${request.diningDetails.time} · party of ${request.diningDetails.partySize}`
        : "";

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <Link href="/portal" className="text-sm text-muted hover:text-ink-soft">
        ← All requests
      </Link>

      <p className="eyebrow mt-6">
        {request.vertical === "STAY" ? "Wannago" : "Wanna Eats"} · {request.city}
      </p>
      <h1 className="mt-2 font-serif text-h1 text-ink">{customerStatusLabel(request.status)}</h1>
      {summary && <p className="mt-3 text-ink-soft">{summary}</p>}

      {(request.status === "NEW" || request.status === "IN_PROGRESS") && (
        <p className="card mt-10 text-ink-soft">
          We&apos;re reaching out to partners now — we&apos;ll follow up within a day or
          two with your options.
        </p>
      )}

      {request.status === "SENT_TO_CUSTOMER" && (
        <div className="mt-10">
          <p className="text-lg text-ink-soft">
            {request.vertical === "STAY"
              ? "Here's what we found — pick the one you'd like."
              : "Here's our recommendation."}
          </p>
          <ul className="mt-6 space-y-6">
            {request.shortlistOptions.map((o) => (
              <li key={o.id} className="overflow-hidden rounded-3xl bg-card">
                <OptionPhoto src={o.photoUrl} alt={o.name} className="h-64 w-full object-cover sm:h-72" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="font-serif text-h3 text-ink">{o.name}</h2>
                    {o.price !== null && (
                      <p className="font-serif text-h3 text-ink-soft">{formatMoney(o.price)}</p>
                    )}
                  </div>
                  {o.notes && <p className="mt-3 leading-relaxed text-ink-soft">{o.notes}</p>}
                  <div className="mt-6">
                    <SelectOptionButton requestId={request.id} optionId={o.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {request.status === "SELECTED" && request.selectedOption && (
        <div className="mt-10 overflow-hidden rounded-3xl bg-card">
          <OptionPhoto
            src={request.selectedOption.photoUrl}
            alt={request.selectedOption.name}
            className="h-64 w-full object-cover sm:h-72"
          />
          <div className="p-6 sm:p-8">
            <p className="eyebrow">Your pick</p>
            <h2 className="mt-2 font-serif text-h3 text-ink">{request.selectedOption.name}</h2>
            {request.selectedOption.price !== null && (
              <p className="mt-1 font-serif text-h3 text-ink-soft">
                {formatMoney(request.selectedOption.price)}
              </p>
            )}
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              We&apos;re finalizing this with the {request.vertical === "STAY" ? "hotel" : "restaurant"}{" "}
              now. Need to change your mind? Just reply to any of our emails.
            </p>
          </div>
        </div>
      )}

      {request.status === "BOOKED" && (
        <div className="card mt-10">
          <p className="font-serif text-h3 text-ink">You&apos;re booked 🎉</p>
          {request.selectedOption && (
            <p className="mt-2 text-ink-soft">{request.selectedOption.name}</p>
          )}
        </div>
      )}

      {request.status === "CLOSED_LOST" && (
        <p className="card mt-10 text-ink-soft">
          This request is closed. If you&apos;d like to start a new one, head back home.
        </p>
      )}
    </div>
  );
}
