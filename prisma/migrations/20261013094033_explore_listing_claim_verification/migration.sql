-- AlterTable
ALTER TABLE "ExploreListing" ADD COLUMN     "aiSourceExcerpts" JSONB,
ADD COLUMN     "aiClaimChecks" JSONB,
ADD COLUMN     "aiOriginalDescription" TEXT,
ADD COLUMN     "aiOriginalLongDescription" TEXT,
ADD COLUMN     "approvedWithOverride" BOOLEAN NOT NULL DEFAULT false;
