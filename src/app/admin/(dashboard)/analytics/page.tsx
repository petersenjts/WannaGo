import { db } from "@/lib/db";

function parseRange(from?: string, to?: string): { from: Date; to: Date; fromStr: string; toStr: string } {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromDate = from ? new Date(`${from}T00:00:00.000`) : defaultFrom;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : now;

  return {
    from: fromDate,
    to: toDate,
    fromStr: from ?? fromDate.toISOString().slice(0, 10),
    toStr: to ?? now.toISOString().slice(0, 10),
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const { from, to, fromStr, toStr } = parseRange(fromParam, toParam);
  const range = { gte: from, lte: to };

  const [
    visitorCount,
    swipeCount,
    likeCount,
    passCount,
    viewCount,
    requestingCustomers,
    activeVisitors,
    mostLiked,
    mostPassed,
    allCustomersWithRequests,
  ] = await Promise.all([
    db.exploreVisitor.count({ where: { createdAt: range } }),
    db.exploreSwipe.count({ where: { createdAt: range } }),
    db.exploreSwipe.count({ where: { createdAt: range, liked: true } }),
    db.exploreSwipe.count({ where: { createdAt: range, liked: false } }),
    db.exploreListingView.count({ where: { createdAt: range } }),
    db.customer.findMany({
      where: { requests: { some: { createdAt: range } } },
      select: { id: true, exploreVisitors: { select: { id: true } } },
    }),
    db.exploreVisitor.findMany({
      where: { OR: [{ createdAt: range }, { swipes: { some: { createdAt: range } } }] },
      select: { customerId: true },
    }),
    db.exploreSwipe.groupBy({
      by: ["listingId"],
      where: { liked: true, createdAt: range },
      _count: { listingId: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 10,
    }),
    db.exploreSwipe.groupBy({
      by: ["listingId"],
      where: { liked: false, createdAt: range },
      _count: { listingId: true },
      orderBy: { _count: { listingId: "desc" } },
      take: 10,
    }),
    db.customer.findMany({
      where: { requests: { some: {} } },
      select: { requests: { select: { vertical: true } } },
    }),
  ]);

  const linkedRequestingCustomers = requestingCustomers.filter((c) => c.exploreVisitors.length > 0).length;

  const linkedCustomerIds = [
    ...new Set(activeVisitors.map((v) => v.customerId).filter((id): id is string => id !== null)),
  ];
  const activeVisitorsWithRequest =
    linkedCustomerIds.length > 0
      ? await db.customer.count({ where: { id: { in: linkedCustomerIds }, requests: { some: {} } } })
      : 0;

  const listingIds = [...new Set([...mostLiked.map((r) => r.listingId), ...mostPassed.map((r) => r.listingId)])];
  const listings = await db.exploreListing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, name: true, vertical: true },
  });
  const listingById = new Map(listings.map((l) => [l.id, l]));

  let stayOnly = 0;
  let dineOnly = 0;
  let both = 0;
  for (const c of allCustomersWithRequests) {
    const verticals = new Set(c.requests.map((r) => r.vertical));
    if (verticals.size > 1) both++;
    else if (verticals.has("STAY")) stayOnly++;
    else if (verticals.has("DINE")) dineOnly++;
  }

  return (
    <div>
      <h1 className="font-serif text-h1 text-ink">Analytics</h1>
      <p className="mt-2 text-ink-soft">Explore funnel and cross-vertical usage.</p>

      <form className="mt-8 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="field-label" htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={fromStr} className="field-input w-auto [--accent:var(--color-ink)]" />
        </div>
        <div>
          <label className="field-label" htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={toStr} className="field-input w-auto [--accent:var(--color-ink)]" />
        </div>
        <button type="submit" className="btn-primary [--accent:var(--color-ink)]">Filter</button>
      </form>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["Visitors", visitorCount],
          ["Swipes", swipeCount],
          ["Likes", likeCount],
          ["Passes", passCount],
          ["Detail views", viewCount],
        ].map(([label, value]) => (
          <div key={label as string} className="card">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-serif text-h2 text-ink">{value}</p>
          </div>
        ))}
      </div>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Explore → request conversion</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Of {requestingCustomers.length} customer{requestingCustomers.length === 1 ? "" : "s"} who submitted a
          request in this range, <strong>{linkedRequestingCustomers}</strong> had a linked Explore visitor — the
          same browser/cookie active at submission time. A different device at submission time wouldn&apos;t be
          captured, so this is a reasonable but imperfect proxy for &quot;used Explore first.&quot;
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Of {linkedCustomerIds.length} Explore visitor{linkedCustomerIds.length === 1 ? "" : "s"} active in this
          range and linked to a customer, <strong>{activeVisitorsWithRequest}</strong> have submitted at least one
          request (any time).
        </p>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="card">
          <h2 className="font-serif text-h2 text-ink">Most liked</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {mostLiked.map((r) => (
              <li key={r.listingId} className="flex justify-between">
                <span className="text-ink">{listingById.get(r.listingId)?.name ?? r.listingId}</span>
                <span className="text-ink-soft">{r._count.listingId}</span>
              </li>
            ))}
            {mostLiked.length === 0 && <li className="text-muted">No likes in this range.</li>}
          </ul>
        </section>
        <section className="card">
          <h2 className="font-serif text-h2 text-ink">Most passed</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {mostPassed.map((r) => (
              <li key={r.listingId} className="flex justify-between">
                <span className="text-ink">{listingById.get(r.listingId)?.name ?? r.listingId}</span>
                <span className="text-ink-soft">{r._count.listingId}</span>
              </li>
            ))}
            {mostPassed.length === 0 && <li className="text-muted">No passes in this range.</li>}
          </ul>
        </section>
      </div>

      <section className="card mt-8">
        <h2 className="font-serif text-h2 text-ink">Cross-vertical customers (all-time)</h2>
        <p className="mt-1 text-xs text-muted">
          Not filtered by the date range above — this is the cumulative number the business case depends on, and a
          date window would understate it.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-serif text-h2 text-ink">{stayOnly}</p>
            <p className="text-xs text-muted">Wannago only</p>
          </div>
          <div>
            <p className="font-serif text-h2 text-ink">{dineOnly}</p>
            <p className="text-xs text-muted">Wanna Eats only</p>
          </div>
          <div>
            <p className="font-serif text-h2 text-dine-strong">{both}</p>
            <p className="text-xs text-muted">Both verticals</p>
          </div>
        </div>
      </section>

      <p className="mt-8 text-xs text-muted">
        Privacy note: the Netherlands&apos; narrow cookie-consent exemption (Telecommunicatiewet art. 11.7a) doesn&apos;t
        cover the Explore visitor cookie, since it already builds a per-visitor behavioral profile that gets linked
        to an identified customer at request-submission time — that predates this page and isn&apos;t something this
        page changes. This page only reads that already-collected data server-side, admin-only, and adds no new
        client-side tracking of its own. If you want to resolve the underlying gap, get real legal advice — this
        isn&apos;t that.
      </p>
    </div>
  );
}
