import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateListing, toggleListingActive, deletePhoto, deleteListing } from "@/actions/explore-admin";
import { refreshListingFromGoogle } from "@/actions/google-places";
import { GooglePlaceSearch } from "@/components/admin/google-place-search";

export default async function ExploreListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await db.exploreListing.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  if (!listing) notFound();

  return (
    <div className="[--accent:var(--color-ink)]">
      <Link href="/admin/explore" className="text-sm text-muted hover:text-ink-soft">
        ← All Explore listings
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{listing.vertical === "STAY" ? "Wannago" : "Wanna Eats"}</p>
          <h1 className="mt-2 font-serif text-h1 text-ink">{listing.name}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <form action={toggleListingActive.bind(null, listing.id, !listing.active)}>
            <button type="submit" className="btn-secondary">
              {listing.active ? "Mark inactive" : "Mark active"}
            </button>
          </form>
          {listing.googlePlaceId && (
            <form action={refreshListingFromGoogle.bind(null, listing.id)} className="flex flex-col items-end gap-1">
              <button type="submit" className="text-xs text-muted hover:text-ink">
                Refresh from Google
              </button>
              {listing.googleLastSyncedAt && (
                <span className="text-xs text-muted">
                  Last synced {listing.googleLastSyncedAt.toLocaleDateString()}
                </span>
              )}
            </form>
          )}
        </div>
      </div>

      {listing.photos.length > 0 && (
        <section className="card mt-8">
          <h2 className="font-serif text-h2 text-ink">Current photos</h2>
          <ul className="mt-4 flex flex-wrap gap-4">
            {listing.photos.map((p) => (
              <li key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={listing.name} className="h-24 w-24 rounded-lg object-cover" />
                <form action={deletePhoto.bind(null, listing.id, p.id)} className="mt-1">
                  <button type="submit" className="text-xs text-muted hover:text-danger">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-8 max-w-2xl">
        <h2 className="font-serif text-h2 text-ink">Details</h2>
        <p className="field-hint mt-1">
          Public page:{" "}
          <a href={`/explore/${listing.slug}`} target="_blank" className="text-ink-soft hover:underline">
            wanna-go.net/explore/{listing.slug}
          </a>
        </p>
        <form
          action={updateListing.bind(null, listing.id)}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="field-label" htmlFor="name">Name</label>
            <input id="name" name="name" type="text" defaultValue={listing.name} required className="field-input" />
          </div>
          <GooglePlaceSearch
            defaultQuery={listing.name}
            neighborhoodInputId="neighborhood"
            priceRadioGroupName="priceLevel"
            vertical={listing.vertical}
            initial={
              listing.googlePlaceId
                ? {
                    placeId: listing.googlePlaceId,
                    name: listing.name,
                    formattedAddress: listing.googleFormattedAddress ?? "",
                    rating: listing.googleRating,
                    reviewCount: listing.googleReviewCount,
                    cuisine: listing.cuisine,
                    lastSyncedAt: listing.googleLastSyncedAt?.toISOString() ?? null,
                  }
                : null
            }
          />

          <div>
            <label className="field-label" htmlFor="neighborhood">Neighborhood / area</label>
            <input
              id="neighborhood"
              name="neighborhood"
              type="text"
              defaultValue={listing.neighborhood ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <p className="field-label">Price</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((level) => (
                <label key={level} className="tag-chip">
                  <input
                    type="radio"
                    name="priceLevel"
                    value={level}
                    defaultChecked={level === listing.priceLevel}
                    className="sr-only"
                  />
                  {"€".repeat(level)}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="description">Short description</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={listing.description ?? ""}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="longDescription">Long description</label>
            <textarea
              id="longDescription"
              name="longDescription"
              rows={12}
              defaultValue={listing.longDescription ?? ""}
              className="field-input"
            />
            <p className="field-hint">Shown on the listing&apos;s own page. Plain text — separate paragraphs with a blank line.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="tags">Tags</label>
            <input id="tags" name="tags" type="text" defaultValue={listing.tags.join(", ")} className="field-input" />
            <p className="field-hint">Comma-separated — write whatever&apos;s useful, no fixed list.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="photos">Add more photos</label>
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-paper-alt file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>
      </section>

      <form action={deleteListing.bind(null, listing.id)} className="mt-8">
        <button type="submit" className="text-sm text-muted hover:text-danger">
          Delete this listing permanently
        </button>
        <p className="mt-1 text-xs text-muted">
          Removes its swipe history too — usually &quot;Mark inactive&quot; above is what you want instead.
        </p>
      </form>
    </div>
  );
}
