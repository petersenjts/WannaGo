-- AlterTable
ALTER TABLE "ExploreListing" ADD COLUMN     "longDescription" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ExploreListing_slug_key" ON "ExploreListing"("slug");
