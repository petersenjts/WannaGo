-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'SELECTED';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "selectedAt" TIMESTAMP(3),
ADD COLUMN     "selectedOptionId" TEXT;

-- AlterTable
ALTER TABLE "ShortlistOption" ADD COLUMN     "photoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Request_selectedOptionId_key" ON "Request"("selectedOptionId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "ShortlistOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
