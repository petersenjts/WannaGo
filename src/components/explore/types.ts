import type { ExploreListing, ExploreListingPhoto } from "@prisma/client";

export type ListingWithPhotos = ExploreListing & { photos: ExploreListingPhoto[] };
