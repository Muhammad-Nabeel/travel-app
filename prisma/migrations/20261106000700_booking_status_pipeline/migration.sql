-- Bookings move to the sales pipeline statuses admins work with:
-- OPEN -> PROCESSING -> SUCCESS / LOST.
CREATE TYPE "BookingStatus_new" AS ENUM ('OPEN', 'PROCESSING', 'SUCCESS', 'LOST');

ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING (
    CASE "status"::text
        WHEN 'PENDING' THEN 'OPEN'
        WHEN 'CONFIRMED' THEN 'SUCCESS'
        ELSE 'LOST'
    END
)::"BookingStatus_new";

DROP TYPE "BookingStatus";

ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- Link existing guest bookings to the account that owns the contact email,
-- matching how new bookings are linked.
UPDATE "Booking" AS b
SET "userId" = u."id"
FROM "User" AS u
WHERE b."userId" IS NULL
  AND b."customerEmail" IS NOT NULL
  AND lower(trim(b."customerEmail")) = u."email";
