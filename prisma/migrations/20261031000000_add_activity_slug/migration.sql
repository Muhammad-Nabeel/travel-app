-- Readable activity URLs: /activities/desert-safari-dubai instead of the cuid.
ALTER TABLE "Activity" ADD COLUMN "slug" TEXT;

-- Backfill from "<title> <destination city>", using the same rules as
-- src/lib/activity-slug.ts. Duplicates get -2, -3, ... in creation order.
WITH base AS (
    SELECT
        a."id",
        a."createdAt",
        COALESCE(
            NULLIF(
                LEFT(
                    TRIM(BOTH '-' FROM REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(LOWER(TRIM(a."title" || ' ' || d."city")), '[^a-z0-9\s-]', '', 'g'),
                            '\s+', '-', 'g'),
                        '-+', '-', 'g')),
                    80),
                ''),
            'activity'
        ) AS slug
    FROM "Activity" a
    JOIN "Destination" d ON d."id" = a."destinationId"
),
numbered AS (
    SELECT
        "id",
        slug,
        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt", "id") AS n
    FROM base
)
UPDATE "Activity" AS a
SET "slug" = CASE WHEN numbered.n = 1 THEN numbered.slug ELSE numbered.slug || '-' || numbered.n END
FROM numbered
WHERE numbered."id" = a."id";

CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");
