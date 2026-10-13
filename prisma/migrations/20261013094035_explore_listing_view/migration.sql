-- CreateTable
CREATE TABLE "ExploreListingView" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExploreListingView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExploreListingView_listingId_idx" ON "ExploreListingView"("listingId");

-- CreateIndex
CREATE INDEX "ExploreListingView_createdAt_idx" ON "ExploreListingView"("createdAt");

-- AddForeignKey
ALTER TABLE "ExploreListingView" ADD CONSTRAINT "ExploreListingView_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ExploreListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
