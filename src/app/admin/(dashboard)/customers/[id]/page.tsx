import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { VerticalBadge, StatusBadge } from "@/components/badges";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      requests: {
        include: { stayDetails: true, diningDetails: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const verticals = new Set(customer.requests.map((r) => r.vertical));
  const usesBoth = verticals.size > 1;

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-muted hover:text-ink-soft">
        ← All customers
      </Link>

      <h1 className="mt-4 font-serif text-3xl text-ink">{customer.name}</h1>
      <p className="mt-1 text-ink-soft">
        {customer.email ?? "no email"} · {customer.phone ?? "no phone"} · customer since{" "}
        {formatDate(customer.createdAt)}
      </p>

      <div className="mt-4 rounded-lg border border-line bg-paper-alt px-4 py-3 text-sm">
        {usesBoth ? (
          <p className="text-ink-soft">
            Uses both <span className="font-medium text-stay-strong">Wannago</span> and{" "}
            <span className="font-medium text-dine-strong">Wanna Eats</span> — a fully cross-vertical
            customer.
          </p>
        ) : verticals.has("STAY") ? (
          <p className="text-ink-soft">
            Has only used <span className="font-medium text-stay-strong">Wannago</span>. Worth a nudge
            toward Wanna Eats.
          </p>
        ) : (
          <p className="text-ink-soft">
            Has only used <span className="font-medium text-dine-strong">Wanna Eats</span>. Worth a
            nudge toward Wannago.
          </p>
        )}
      </div>

      <h2 className="mt-8 font-serif text-xl text-ink">All requests</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Vertical</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.requests.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-alt/50">
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/requests/${r.id}`} className="text-ink-soft hover:text-ink">
                    {formatDateTime(r.createdAt)}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <VerticalBadge vertical={r.vertical} />
                </td>
                <td className="px-4 py-3 align-top text-ink-soft">{r.city}</td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
