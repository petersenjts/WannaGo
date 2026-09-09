import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const customers = await db.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    include: { requests: { select: { vertical: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Customers</h1>
      <p className="mt-1 text-ink-soft">
        Matched by email or phone — this is what ties Wannago and Wanna Eats requests together.
      </p>

      <form className="mt-6" method="get">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, or phone"
          className="field-input max-w-sm [--accent:var(--color-ink)]"
        />
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Requests</th>
              <th className="px-4 py-3 font-medium">Verticals used</th>
              <th className="px-4 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const verticals = new Set(c.requests.map((r) => r.vertical));
              const usesBoth = verticals.size > 1;
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper-alt/50">
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-ink-soft">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-soft">{c.requests.length}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {verticals.has("STAY") && (
                        <span className="rounded-full bg-stay-soft px-2 py-0.5 text-xs font-medium text-stay-strong">
                          Wannago
                        </span>
                      )}
                      {verticals.has("DINE") && (
                        <span className="rounded-full bg-dine-soft px-2 py-0.5 text-xs font-medium text-dine-strong">
                          Wanna Eats
                        </span>
                      )}
                      {!usesBoth && (
                        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                          Hasn&apos;t tried the other side
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-ink-soft">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
