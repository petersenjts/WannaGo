-- AlterTable
ALTER TABLE "ExploreListing" ADD COLUMN     "cuisine" TEXT,
ADD COLUMN     "googleFormattedAddress" TEXT,
ADD COLUMN     "googleLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "googleRating" DOUBLE PRECISION,
ADD COLUMN     "googleReviewCount" INTEGER;

-- CreateIndex
CREATE INDEX "ExploreListing_googlePlaceId_idx" ON "ExploreListing"("googlePlaceId");
