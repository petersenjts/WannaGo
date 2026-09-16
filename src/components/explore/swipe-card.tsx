import { OptionPhoto } from "@/components/option-photo";
import { priceLevelLabel } from "@/lib/price-level";
import type { ListingWithPhotos } from "./types";

export function SwipeCard({
  listing,
  photoIndex,
  onDotClick,
}: {
  listing: ListingWithPhotos;
  photoIndex: number;
  onDotClick?: (index: number) => void;
}) {
  const photo = listing.photos[photoIndex] ?? listing.photos[0] ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-[0_8px_30px_-8px_rgba(51,41,31,0.25)]">
      <div className="relative h-3/5 shrink-0 bg-paper-alt">
        <OptionPhoto src={photo?.url ?? null} alt={listing.name} className="h-full w-full object-cover" />

        {listing.photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
            {listing.photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDotClick?.(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === photoIndex ? "w-5 bg-card" : "w-1.5 bg-card/50"
                }`}
              />
            ))}
          </div>
        )}

        {listing.googlePlaceId && (
          <p className="absolute bottom-2 right-3 rounded bg-card/70 px-1.5 py-0.5 text-xs text-ink-soft">
            Google Maps
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-serif text-h3 text-ink">{listing.name}</h2>
          <p className="text-ink-soft">
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
        {listing.description && <p className="mt-3 leading-relaxed text-ink-soft">{listing.description}</p>}
        {(listing.cuisine || listing.tags.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {listing.vertical === "DINE" && listing.cuisine && (
              <span className="rounded-full bg-paper-alt px-2.5 py-0.5 text-xs text-ink-soft">
                {listing.cuisine}
              </span>
            )}
            {listing.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-paper-alt px-2.5 py-0.5 text-xs text-ink-soft">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
