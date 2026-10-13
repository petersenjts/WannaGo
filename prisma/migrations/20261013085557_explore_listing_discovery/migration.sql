-- CreateEnum
CREATE TYPE "ExploreListingReviewStatus" AS ENUM ('PENDING_REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "ExploreListing" ADD COLUMN     "reviewStatus" "ExploreListingReviewStatus",
ADD COLUMN     "aiSourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiUncertainClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ExploreListing_reviewStatus_idx" ON "ExploreListing"("reviewStatus");
