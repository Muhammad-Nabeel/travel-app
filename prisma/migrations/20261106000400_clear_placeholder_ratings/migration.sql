-- Ratings were seeded (or defaulted to 4.5) without any real reviews behind
-- them. A rating only means something alongside a review count, so clear it
-- wherever there are no reviews, and stop new rows starting at 4.5.

UPDATE "Activity" SET "reviews" = 0 WHERE "reviewCount" = 0;
UPDATE "TourPackage" SET "rating" = 0 WHERE "reviewCount" = 0;

ALTER TABLE "Activity" ALTER COLUMN "reviews" SET DEFAULT 0;
ALTER TABLE "TourPackage" ALTER COLUMN "rating" SET DEFAULT 0;
