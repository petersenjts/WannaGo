import { OptionPhoto } from "@/components/option-photo";
import { priceLevelLabel } from "@/lib/price-level";
import { LikeButton } from "./like-button";
import type { ListingWithPhotos } from "./types";

export function ExploreGrid({ listings }: { listings: ListingWithPhotos[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <div key={listing.id} className="overflow-hidden rounded-3xl bg-card">
          <div className="relative">
            <OptionPhoto
              src={listing.photos[0]?.url ?? null}
              alt={listing.name}
              className="h-48 w-full object-cover"
            />
            <div className="absolute right-3 top-3">
              <LikeButton listingId={listing.id} />
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-serif text-h3 text-ink">{listing.name}</h3>
              <p className="text-sm text-ink-soft">
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
            {(() => {
              const chips =
                listing.vertical === "DINE" && listing.cuisine
                  ? [listing.cuisine, ...listing.tags]
                  : listing.tags;
              return (
                chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {chips.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-paper-alt px-2.5 py-0.5 text-xs text-ink-soft">
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              );
            })()}
            {listing.googlePlaceId && <p className="mt-3 text-xs text-muted">Google Maps</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
