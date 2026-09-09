import Link from "next/link";
import { getPortalSession } from "@/lib/portal-auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { customerStatusLabel } from "@/lib/portal-status";
import { getVerticalsByCustomer } from "@/lib/customer-verticals";

export default async function PortalHomePage() {
  const email = await getPortalSession();
  if (!email) return null; // proxy.ts already guards this route

  const customer = await db.customer.findFirst({
    where: { email },
    include: { requests: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) {
    return (
      <div>
        <h1 className="font-serif text-h1 text-ink">Your requests</h1>
        <p className="mt-4 text-ink-soft">We couldn&apos;t find any requests for this account.</p>
      </div>
    );
  }

  const verticals = (await getVerticalsByCustomer([customer.id])).get(customer.id) ?? new Set();
  const usesBoth = verticals.size > 1;
  const singleVertical = verticals.size === 1 ? [...verticals][0] : null;

  return (
    <div>
      <h1 className="font-serif text-h1 text-ink">Hi {customer.name.split(" ")[0]}</h1>
      <p className="mt-2 text-ink-soft">Here&apos;s where things stand with your requests.</p>

      {!usesBoth && singleVertical && (
        <div className="mt-6 rounded-xl bg-paper-alt px-5 py-4 text-sm text-ink-soft">
          {singleVertical === "STAY" ? (
            <>
              Looking for somewhere to eat too?{" "}
              <Link href="/eats" className="font-medium text-dine-strong hover:underline">
                Try Wanna Eats
              </Link>
              .
            </>
          ) : (
            <>
              Planning a trip too?{" "}
              <Link href="/stay" className="font-medium text-stay-strong hover:underline">
                Try Wannago
              </Link>
              .
            </>
          )}
        </div>
      )}

      <ul className="mt-10 space-y-4">
        {customer.requests.map((r) => (
          <li key={r.id}>
            <Link
              href={`/portal/requests/${r.id}`}
              className={
                r.vertical === "STAY"
                  ? "card block transition-shadow hover:shadow-[0_1px_24px_-4px_rgba(122,68,41,0.2)] [--accent:var(--color-stay)]"
                  : "card block transition-shadow hover:shadow-[0_1px_24px_-4px_rgba(78,85,64,0.2)] [--accent:var(--color-dine)]"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    {r.vertical === "STAY" ? "Wannago" : "Wanna Eats"} · {r.city}
                  </p>
                  <p className="mt-2 font-serif text-h3 text-ink">{customerStatusLabel(r.status)}</p>
                </div>
                <p className="text-sm text-muted">{formatDate(r.createdAt)}</p>
              </div>
            </Link>
          </li>
        ))}
        {customer.requests.length === 0 && (
          <p className="text-sm text-muted">No requests yet.</p>
        )}
      </ul>
    </div>
  );
}
