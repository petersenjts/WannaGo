-- CreateTable
CREATE TABLE "ExploreListing" (
    "id" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "neighborhood" TEXT,
    "priceLevel" INTEGER NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExploreListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExploreListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExploreListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExploreVisitor" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExploreVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExploreSwipe" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExploreSwipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExploreListing_vertical_active_idx" ON "ExploreListing"("vertical", "active");

-- CreateIndex
CREATE INDEX "ExploreVisitor_customerId_idx" ON "ExploreVisitor"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExploreSwipe_visitorId_listingId_key" ON "ExploreSwipe"("visitorId", "listingId");

-- AddForeignKey
ALTER TABLE "ExploreListingPhoto" ADD CONSTRAINT "ExploreListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ExploreListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExploreVisitor" ADD CONSTRAINT "ExploreVisitor_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExploreSwipe" ADD CONSTRAINT "ExploreSwipe_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "ExploreVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExploreSwipe" ADD CONSTRAINT "ExploreSwipe_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ExploreListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
