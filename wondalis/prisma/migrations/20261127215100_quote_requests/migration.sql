-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlaceRegion" AS ENUM ('GHANA', 'ABROAD');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "PlaceRegion" NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "refNumber" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "residence" TEXT NOT NULL,
    "userId" TEXT,
    "travellers" INTEGER NOT NULL,
    "startsOn" DATE,
    "endsOn" DATE,
    "flexible" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "QuoteStatus" NOT NULL DEFAULT 'NEW',
    "quotedUsdCents" INTEGER,
    "depositPct" INTEGER,
    "quoteMessage" TEXT,
    "quotedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "quotedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "bookingId" TEXT,
    "tripId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequestPlace" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "placeId" TEXT,
    "name" TEXT NOT NULL,
    "region" "PlaceRegion" NOT NULL,

    CONSTRAINT "QuoteRequestPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_active_position_idx" ON "Place"("active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_refNumber_key" ON "QuoteRequest"("refNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_token_key" ON "QuoteRequest"("token");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_bookingId_key" ON "QuoteRequest"("bookingId");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteRequest_email_idx" ON "QuoteRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequestPlace_requestId_placeId_key" ON "QuoteRequestPlace"("requestId", "placeId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestPlace" ADD CONSTRAINT "QuoteRequestPlace_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestPlace" ADD CONSTRAINT "QuoteRequestPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
