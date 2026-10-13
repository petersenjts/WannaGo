import Link from "next/link";
import { db } from "@/lib/db";
import { priceLevelLabel } from "@/lib/price-level";
import { createListing } from "@/actions/explore-admin";
import { GooglePlaceSearch } from "@/components/admin/google-place-search";
import { ReviewStatusBadge } from "@/components/badges";

export default async function ExploreAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; review?: string }>;
}) {
  const { vertical: verticalParam, review: reviewParam } = await searchParams;
  const vertical = verticalParam === "STAY" || verticalParam === "DINE" ? verticalParam : undefined;
  const reviewStatus =
    reviewParam === "pending" ? "PENDING_REVIEW" : reviewParam === "rejected" ? "REJECTED" : undefined;

  const [listings, pendingReviewCount] = await Promise.all([
    db.exploreListing.findMany({
      where: { ...(vertical ? { vertical } : {}), ...(reviewStatus ? { reviewStatus } : {}) },
      include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.exploreListing.count({ where: { reviewStatus: "PENDING_REVIEW" } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-h1 text-ink">Explore</h1>
          <p className="mt-2 text-ink-soft">
            The curated catalog people swipe or browse at wanna-go.net/explore.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/admin/explore/discover" className="btn-secondary [--accent:var(--color-ink)]">
            Discover new listings
          </Link>
          {pendingReviewCount > 0 && (
            <Link href="/admin/explore?review=pending" className="text-xs text-muted hover:text-ink">
              {pendingReviewCount} pending review
            </Link>
          )}
        </div>
      </div>

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <select name="vertical" defaultValue={vertical ?? ""} className="field-input w-auto [--accent:var(--color-ink)]">
          <option value="">All verticals</option>
          <option value="STAY">Wannago (stays)</option>
          <option value="DINE">Wanna Eats (dining)</option>
        </select>
        <select name="review" defaultValue={reviewParam ?? ""} className="field-input w-auto [--accent:var(--color-ink)]">
          <option value="">All listings</option>
          <option value="pending">Pending review</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" className="btn-primary [--accent:var(--color-ink)]">
          Filter
        </button>
      </form>

      <div className="mt-10 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="eyebrow">
            <tr>
              <th className="px-5 py-4 font-medium">Name</th>
              <th className="px-5 py-4 font-medium">Vertical</th>
              <th className="px-5 py-4 font-medium">Neighborhood</th>
              <th className="px-5 py-4 font-medium">Price</th>
              <th className="px-5 py-4 font-medium">Photos</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Review</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="even:bg-paper-alt/40 hover:bg-paper-alt">
                <td className="px-5 py-4 align-top">
                  <Link href={`/admin/explore/${l.id}`} className="font-medium text-ink hover:underline">
                    {l.name}
                  </Link>
                </td>
                <td className="px-5 py-4 align-top text-ink-soft">
                  {l.vertical === "STAY" ? "Wannago" : "Wanna Eats"}
                </td>
                <td className="px-5 py-4 align-top text-ink-soft">{l.neighborhood ?? "—"}</td>
                <td className="px-5 py-4 align-top text-ink-soft">{priceLevelLabel(l.priceLevel)}</td>
                <td className="px-5 py-4 align-top text-ink-soft">{l.photos.length > 0 ? "✓" : "—"}</td>
                <td className="px-5 py-4 align-top">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.active ? "bg-[#DCE3CE] text-dine-strong" : "bg-paper-alt text-muted"
                    }`}
                  >
                    {l.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 align-top">
                  {l.reviewStatus && <ReviewStatusBadge status={l.reviewStatus} />}
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted">
                  No Explore listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="card mt-12 max-w-2xl">
        <h2 className="font-serif text-h2 text-ink">Add a listing</h2>
        <form action={createListing} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="e-name">Name</label>
            <input id="e-name" name="name" type="text" required className="field-input [--accent:var(--color-ink)]" />
          </div>
          <div>
            <label className="field-label" htmlFor="e-vertical">Vertical</label>
            <select id="e-vertical" name="vertical" required className="field-input [--accent:var(--color-ink)]">
              <option value="STAY">Wannago (hotel)</option>
              <option value="DINE">Wanna Eats (restaurant)</option>
            </select>
          </div>
          <GooglePlaceSearch
            defaultQuery=""
            neighborhoodInputId="e-neighborhood"
            priceRadioGroupName="priceLevel"
            vertical={null}
            verticalSelectId="e-vertical"
            initial={null}
          />

          <div>
            <label className="field-label" htmlFor="e-neighborhood">Neighborhood / area</label>
            <input
              id="e-neighborhood"
              name="neighborhood"
              type="text"
              placeholder="Jordaan, De Pijp..."
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div>
            <p className="field-label">Price</p>
            <div className="flex gap-2 [--accent:var(--color-ink)]">
              {[1, 2, 3, 4].map((level) => (
                <label key={level} className="tag-chip">
                  <input type="radio" name="priceLevel" value={level} defaultChecked={level === 2} className="sr-only" />
                  {"€".repeat(level)}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="e-description">Short description</label>
            <textarea
              id="e-description"
              name="description"
              rows={2}
              placeholder="A sentence or two, in your own words."
              className="field-input [--accent:var(--color-ink)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="e-longDescription">Long description</label>
            <textarea
              id="e-longDescription"
              name="longDescription"
              rows={12}
              placeholder="The full write-up — as many paragraphs as you like. Leave a blank line between paragraphs."
              className="field-input [--accent:var(--color-ink)]"
            />
            <p className="field-hint">Shown on the listing&apos;s own page. Plain text — separate paragraphs with a blank line.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="e-tags">Tags</label>
            <input
              id="e-tags"
              name="tags"
              type="text"
              placeholder="boutique, canal view, quiet street, breakfast included"
              className="field-input [--accent:var(--color-ink)]"
            />
            <p className="field-hint">Comma-separated — write whatever&apos;s useful, no fixed list.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="e-photos">Photos</label>
            <input
              id="e-photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="field-input [--accent:var(--color-ink)] file:mr-3 file:rounded-md file:border-0 file:bg-paper-alt file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
            />
            <p className="field-hint">JPG or PNG, up to 5MB each. Select several at once.</p>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary [--accent:var(--color-ink)]">
              Add listing
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
