import Link from "next/link";
import { db } from "@/lib/db";
import { REQUEST_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { getVerticalsByCustomer, otherVertical } from "@/lib/customer-verticals";
import { VerticalBadge, StatusBadge, CrossVerticalBadge } from "@/components/badges";
import { formatDate } from "@/lib/format";
import type { RequestStatus, Vertical } from "@prisma/client";

type SearchParams = {
  vertical?: string;
  status?: string;
  cross?: string;
};

function keyDetail(request: {
  vertical: Vertical;
  stayDetails: { checkIn: Date; checkOut: Date; guests: number } | null;
  diningDetails: { date: Date; partySize: number } | null;
}): string {
  if (request.vertical === "STAY" && request.stayDetails) {
    const { checkIn, checkOut, guests } = request.stayDetails;
    return `${formatDate(checkIn)} → ${formatDate(checkOut)} · ${guests} guest${guests === 1 ? "" : "s"}`;
  }
  if (request.vertical === "DINE" && request.diningDetails) {
    const { date, partySize } = request.diningDetails;
    return `${formatDate(date)} · party of ${partySize}`;
  }
  return "—";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const vertical = params.vertical === "STAY" || params.vertical === "DINE" ? params.vertical : undefined;
  const status = REQUEST_STATUSES.includes(params.status as RequestStatus)
    ? (params.status as RequestStatus)
    : undefined;
  const cross = params.cross === "single" || params.cross === "both" ? params.cross : undefined;

  const requests = await db.request.findMany({
    where: {
      ...(vertical ? { vertical } : {}),
      ...(status ? { status } : {}),
    },
    include: { customer: true, stayDetails: true, diningDetails: true },
    orderBy: { createdAt: "desc" },
  });

  const verticalsByCustomer = await getVerticalsByCustomer(requests.map((r) => r.customerId));

  const hasUsedBoth = (customerId: string) => (verticalsByCustomer.get(customerId)?.size ?? 0) > 1;

  const filtered = requests.filter((r) => {
    if (cross === "both") return hasUsedBoth(r.customerId);
    if (cross === "single") return !hasUsedBoth(r.customerId);
    return true;
  });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-ink">Requests</h1>
        <p className="text-sm text-muted">
          {filtered.length} of {requests.length}
        </p>
      </div>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <select name="vertical" defaultValue={vertical ?? ""} className="field-input w-auto">
          <option value="">All verticals</option>
          <option value="STAY">Wannago (stays)</option>
          <option value="DINE">Wanna Eats (dining)</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="field-input w-auto">
          <option value="">All statuses</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="cross" defaultValue={cross ?? ""} className="field-input w-auto">
          <option value="">Any customer</option>
          <option value="single">Hasn&apos;t tried the other side</option>
          <option value="both">Uses both verticals</option>
        </select>
        <button type="submit" className="btn-primary [--accent:var(--color-ink)]">
          Filter
        </button>
        {(vertical || status || cross) && (
          <Link href="/admin/requests" className="self-center text-sm text-muted hover:text-ink-soft">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Vertical</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-alt/50">
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/requests/${r.id}`} className="block text-ink-soft hover:text-ink">
                    {formatDate(r.createdAt)}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <VerticalBadge vertical={r.vertical} />
                </td>
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/requests/${r.id}`} className="font-medium text-ink hover:underline">
                    {r.customer.name}
                  </Link>
                  {hasUsedBoth(r.customerId) && (
                    <div className="mt-1">
                      <CrossVerticalBadge otherVertical={otherVertical(r.vertical)} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-ink-soft">{r.city}</td>
                <td className="px-4 py-3 align-top text-ink-soft">{keyDetail(r)}</td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No requests match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
