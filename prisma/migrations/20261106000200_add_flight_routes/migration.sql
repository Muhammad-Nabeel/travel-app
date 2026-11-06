-- City-pair flight landing pages (/flights/<origin>-to-<destination>),
-- managed in /admin/flight-routes.
CREATE TABLE "FlightRoute" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originIata" TEXT NOT NULL,
    "originAirport" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "destinationIata" TEXT NOT NULL,
    "destinationAirport" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "flightTime" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "airlines" JSONB NOT NULL DEFAULT '[]',
    "travelTips" JSONB NOT NULL DEFAULT '[]',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "fareFrom" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FlightRoute_slug_key" ON "FlightRoute"("slug");
CREATE UNIQUE INDEX "FlightRoute_originIata_destinationIata_key" ON "FlightRoute"("originIata", "destinationIata");
CREATE INDEX "FlightRoute_isActive_sortOrder_idx" ON "FlightRoute"("isActive", "sortOrder");
