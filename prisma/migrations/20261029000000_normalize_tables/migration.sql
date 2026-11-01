-- Normalize the website schema: 16 tables -> 11.
--   * ServiceRequest rows move into Booking (one table for every customer request).
--   * PaymentSetting moves into AdminSetting under the "site_pricing" key.
--   * Unused TourPackage, PackageBooking and HotelSearchLog are dropped.
--   * Activity gets a real foreign key to Destination.
-- Every step runs in one transaction, so a failure leaves the database untouched.

-- ---------------------------------------------------------------------------
-- Booking: add the columns that ServiceRequest needs
-- ---------------------------------------------------------------------------
ALTER TYPE "RequestType" RENAME TO "BookingType";
CREATE TYPE "BookingChannel" AS ENUM ('CHECKOUT', 'SERVICE_REQUEST', 'CHATBOT');

ALTER TABLE "Booking"
    ADD COLUMN "type" "BookingType",
    ADD COLUMN "channel" "BookingChannel" NOT NULL DEFAULT 'CHECKOUT',
    ADD COLUMN "customerName" TEXT,
    ADD COLUMN "customerEmail" TEXT,
    ADD COLUMN "customerPhone" TEXT,
    ADD COLUMN "title" TEXT,
    ADD COLUMN "payload" JSONB,
    ALTER COLUMN "userId" DROP NOT NULL,
    ALTER COLUMN "provider" DROP NOT NULL,
    ALTER COLUMN "totalAmount" DROP NOT NULL,
    ALTER COLUMN "currency" SET DEFAULT 'PKR';

-- Backfill existing bookings. The type rules mirror the inference the admin
-- bookings list used, so every booking keeps the type admins already see.
UPDATE "Booking" AS b
SET
    "type" = (CASE
        WHEN lower(coalesce(b."paymentData"::text, '')) ~ '(umrah|madinah|makkah)' THEN 'UMRAH'
        WHEN lower(coalesce(b."paymentData"::text, '')) LIKE '%visa%' THEN 'VISA'
        WHEN lower(coalesce(b."paymentData"::text, '')) ~ '(tour|destination|activity)' THEN 'TOUR'
        WHEN lower(coalesce(b."flightData"::text, '')) ~ '(umrah|madinah|makkah)' THEN 'UMRAH'
        WHEN lower(coalesce(b."flightData"::text, '')) LIKE '%visa%' THEN 'VISA'
        WHEN lower(coalesce(b."hotelData"::text, '')) ~ '(umrah|madinah|makkah)' THEN 'UMRAH'
        WHEN lower(coalesce(b."hotelData"::text, '')) LIKE '%visa%' THEN 'VISA'
        WHEN lower(coalesce(b."hotelData"::text, '')) ~ '(tour|destination|activity)' THEN 'TOUR'
        WHEN b."flightData" IS NOT NULL THEN 'FLIGHT'
        WHEN b."hotelData" IS NOT NULL THEN 'HOTEL'
        ELSE 'TOUR'
    END)::"BookingType",
    "channel" = (CASE WHEN b."isChatbotRequest" THEN 'CHATBOT' ELSE 'CHECKOUT' END)::"BookingChannel",
    "customerName" = u."name",
    -- Guest checkouts used generated placeholder emails; they are not real contacts.
    "customerEmail" = CASE WHEN u."email" LIKE 'guest.%@aim.local' THEN NULL ELSE u."email" END,
    "customerPhone" = u."phone",
    "payload" = CASE
        WHEN b."flightData" IS NOT NULL AND b."hotelData" IS NOT NULL
            THEN jsonb_build_object('flight', b."flightData", 'hotel', b."hotelData")
        ELSE coalesce(b."flightData", b."hotelData", '{}'::jsonb)
    END
FROM "User" AS u
WHERE u."id" = b."userId";

-- Copy service requests. A reference already used by a booking gets an "-SR" suffix.
INSERT INTO "Booking" (
    "id", "reference", "type", "channel", "status", "userId",
    "customerName", "customerEmail", "customerPhone", "title",
    "provider", "totalAmount", "currency", "payload", "createdAt", "updatedAt"
)
SELECT
    s."id",
    CASE
        WHEN EXISTS (SELECT 1 FROM "Booking" AS b WHERE b."reference" = s."reference")
            THEN s."reference" || '-SR'
        ELSE s."reference"
    END,
    s."type",
    'SERVICE_REQUEST',
    s."status",
    NULL,
    s."customerName",
    s."customerEmail",
    s."customerPhone",
    s."title",
    NULL,
    s."amount",
    coalesce(s."currency", 'PKR'),
    s."payload",
    s."createdAt",
    s."updatedAt"
FROM "ServiceRequest" AS s;

ALTER TABLE "Booking"
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "payload" SET NOT NULL,
    DROP COLUMN "flightData",
    DROP COLUMN "hotelData",
    DROP COLUMN "isChatbotRequest";

-- Deleting a user keeps their bookings; the customer fields still identify them.
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Booking_type_createdAt_idx" ON "Booking"("type", "createdAt");
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");
CREATE INDEX "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");

DROP TABLE "ServiceRequest";

-- ---------------------------------------------------------------------------
-- PaymentSetting -> AdminSetting("site_pricing")
-- ---------------------------------------------------------------------------
INSERT INTO "AdminSetting" ("id", "key", "value", "createdAt", "updatedAt")
SELECT
    'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    'site_pricing',
    json_build_object(
        'serviceChargePercent', p."serviceChargePercent"::float8,
        'enableWise', p."enableWise",
        'enableStripe', p."enableStripe",
        'enablePaypal', p."enablePaypal",
        'enableSumup', p."enableSumup",
        'enablePaymob', p."enablePaymob",
        'enableCashOnDelivery', p."enableCashOnDelivery",
        'enablePayAtBranch', p."enablePayAtBranch"
    )::text,
    p."createdAt",
    CURRENT_TIMESTAMP
FROM (
    SELECT * FROM "PaymentSetting" ORDER BY "createdAt" ASC LIMIT 1
) AS p
ON CONFLICT ("key") DO UPDATE
    SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP;

DROP TABLE "PaymentSetting";

-- ---------------------------------------------------------------------------
-- Activity -> Destination foreign key
-- ---------------------------------------------------------------------------
-- Activities whose destination was deleted can no longer be shown anywhere.
DELETE FROM "Activity" AS a
WHERE NOT EXISTS (SELECT 1 FROM "Destination" AS d WHERE d."id" = a."destinationId");

CREATE INDEX "Activity_destinationId_idx" ON "Activity"("destinationId");
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_destinationId_fkey"
    FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Unused tables
-- ---------------------------------------------------------------------------
DROP TABLE "PackageBooking";
DROP TABLE "TourPackage";
DROP TABLE "HotelSearchLog";
