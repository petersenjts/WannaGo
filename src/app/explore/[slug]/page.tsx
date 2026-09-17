import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getExploreVisitorId } from "@/lib/explore";
import { priceLevelLabel } from "@/lib/price-level";
import { OptionPhoto } from "@/components/option-photo";
import { PhotoGallery } from "@/components/explore/photo-gallery";
import { DetailSwipeButtons } from "@/components/explore/detail-swipe-buttons";

function paragraphs(text: string): string[] {
  // Browsers normalize <textarea> line endings to CRLF on submit, so blank
  // lines arrive as "\r\n\r\n" — normalize before splitting on blank lines.
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function ExploreListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const listing = await db.exploreListing.findUnique({
    where: { slug },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  if (!listing || !listing.active) notFound();

  const visitorId = await getExploreVisitorId();
  const existingSwipe = visitorId
    ? await db.exploreSwipe.findUnique({
        where: { visitorId_listingId: { visitorId, listingId: listing.id } },
      })
    : null;

  const accent = listing.vertical === "STAY" ? "var(--color-stay)" : "var(--color-dine)";
  const verticalLabel = listing.vertical === "STAY" ? "Wannago" : "Wanna Eats";
  const chips =
    listing.vertical === "DINE" && listing.cuisine ? [listing.cuisine, ...listing.tags] : listing.tags;

  return (
    <div className="min-h-screen bg-paper" style={{ ["--accent" as string]: accent }}>
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-16 sm:px-10">
        <Link href={`/explore?vertical=${listing.vertical}`} className="text-sm text-muted hover:text-ink-soft">
          ← Back to {verticalLabel}
        </Link>

        <p className="eyebrow mt-5">
          {verticalLabel}
          {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
        </p>
        <h1 className="mt-2 font-serif text-h1 text-ink">{listing.name}</h1>

        <div className="mt-6">
          {listing.photos.length > 0 ? (
            <PhotoGallery photos={listing.photos} alt={listing.name} />
          ) : (
            <OptionPhoto src={null} alt={listing.name} className="h-72 w-full rounded-3xl object-cover sm:h-96" />
          )}
        </div>

        <div className="card mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-lg text-ink">
              {priceLevelLabel(listing.priceLevel)}
              {listing.googleRating !== null && (
                <>
                  {" "}
                  · ★ {listing.googleRating.toFixed(1)}
                  {listing.googleReviewCount !== null && ` (${listing.googleReviewCount})`}
                </>
              )}
            </p>
          </div>
          {listing.neighborhood && <p className="mt-1 text-sm text-muted">{listing.neighborhood}</p>}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((tag) => (
                <span key={tag} className="rounded-full bg-paper-alt px-2.5 py-0.5 text-xs text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {listing.googlePlaceId && <p className="mt-3 text-xs text-muted">Google Maps</p>}
        </div>

        {listing.description && (
          <p className="mt-8 text-lg leading-relaxed text-ink-soft">{listing.description}</p>
        )}

        {listing.longDescription && (
          <div className="mt-4">
            {paragraphs(listing.longDescription).map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-ink-soft first:mt-0">
                {p}
              </p>
            ))}
          </div>
        )}

        <div className="mt-8">
          <DetailSwipeButtons listingId={listing.id} initialLiked={existingSwipe?.liked ?? null} />
        </div>

        <p className="mt-8 text-sm text-muted">
          Interested in something like this?{" "}
          <Link
            href={listing.vertical === "STAY" ? "/stay" : "/eats"}
            className="text-ink-soft hover:underline"
          >
            Tell us what you&apos;re after.
          </Link>
        </p>
      </div>
    </div>
  );
}
