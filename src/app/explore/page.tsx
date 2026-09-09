import Link from "next/link";
import { db } from "@/lib/db";
import { getExploreVisitorId } from "@/lib/explore";
import { SwipeDeck } from "@/components/explore/swipe-deck";
import { ExploreGrid } from "@/components/explore/explore-grid";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical: verticalParam } = await searchParams;
  const vertical = verticalParam === "DINE" ? "DINE" : "STAY";

  const visitorId = await getExploreVisitorId();

  const listings = await db.exploreListing.findMany({
    where: {
      vertical,
      active: true,
      ...(visitorId ? { swipes: { none: { visitorId } } } : {}),
    },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const accent = vertical === "STAY" ? "var(--color-stay)" : "var(--color-dine)";

  return (
    <div className="min-h-screen bg-paper" style={{ ["--accent" as string]: accent }}>
      <header className="mx-auto max-w-3xl px-6 pt-10 sm:px-10">
        <Link href="/" className="text-sm text-muted hover:text-ink-soft">
          ← Back
        </Link>
        <h1 className="mt-4 font-serif text-h1 text-ink">Explore</h1>
        <p className="mt-2 text-ink-soft">A few places worth knowing about, picked by hand.</p>

        <div className="mt-6 inline-flex rounded-full bg-paper-alt p-1">
          <Link
            href="/explore?vertical=STAY"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              vertical === "STAY" ? "bg-card text-stay-strong shadow-sm" : "text-ink-soft"
            }`}
          >
            Hotels
          </Link>
          <Link
            href="/explore?vertical=DINE"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              vertical === "DINE" ? "bg-card text-dine-strong shadow-sm" : "text-ink-soft"
            }`}
          >
            Eats
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
        {listings.length === 0 ? (
          <p className="card mt-4 text-ink-soft">
            You&apos;ve seen everything we&apos;ve got in{" "}
            {vertical === "STAY" ? "Wannago" : "Wanna Eats"} right now — check back soon.
          </p>
        ) : (
          <>
            <div className="md:hidden">
              <SwipeDeck listings={listings} />
            </div>
            <div className="hidden md:block">
              <ExploreGrid listings={listings} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
