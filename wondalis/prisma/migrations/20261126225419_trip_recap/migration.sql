-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "recapNote" TEXT,
ADD COLUMN     "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
