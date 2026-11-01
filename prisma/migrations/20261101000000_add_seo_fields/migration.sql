-- Per-page SEO title and description for destinations, activities, Umrah
-- packages and visa pages. Detail pages render these values directly, so
-- they are NOT NULL: every existing row is backfilled first, using the same
-- wording src/lib/seo-suggestions.ts suggests in the admin forms.
--   * Titles must fit 60 characters once " | <brand>" is appended.
--   * Descriptions are capped at 160 characters.
-- Visa countries live in AdminSetting ("visa_countries" JSON), so each entry
-- gets seoTitle/seoDescription keys instead of columns.

CREATE FUNCTION "_seo_brand"() RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
        (SELECT NULLIF(TRIM(s."value"::jsonb ->> 'name'), '')
         FROM "AdminSetting" s
         WHERE s."key" = 'brand_settings'),
        'EasyTrip'
    );
$$;

-- First candidate that fits the title budget, else the last one.
CREATE FUNCTION "_seo_fit_title"(candidates TEXT[]) RETURNS TEXT LANGUAGE plpgsql STABLE AS $$
DECLARE
    budget INT := 60 - LENGTH(' | ' || "_seo_brand"());
    candidate TEXT;
BEGIN
    FOREACH candidate IN ARRAY candidates LOOP
        IF LENGTH(candidate) <= budget THEN
            RETURN candidate;
        END IF;
    END LOOP;
    RETURN candidates[array_length(candidates, 1)];
END;
$$;

-- Same rule as toMetaDescription() in src/lib/seo.ts.
CREATE FUNCTION "_seo_fit_description"(value TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN LENGTH(compact) <= 160 THEN compact
        ELSE RTRIM(LEFT(compact, 159)) || '…'
    END
    FROM (SELECT TRIM(REGEXP_REPLACE(value, '\s+', ' ', 'g')) AS compact) c;
$$;

CREATE FUNCTION "_seo_strip_stop"(value TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT REGEXP_REPLACE(TRIM(value), '[.!?]$', '');
$$;

-- ---------------------------------------------------------------------------
-- Destination
-- ---------------------------------------------------------------------------
ALTER TABLE "Destination"
    ADD COLUMN "seoTitle" TEXT,
    ADD COLUMN "seoDescription" TEXT;

UPDATE "Destination" AS d
SET
    "seoTitle" = "_seo_fit_title"(ARRAY[
        TRIM(d."city") || ' Travel Guide – Best Time, Tips & Flights',
        TRIM(d."city") || ' Travel Guide – Best Time & Tips',
        TRIM(d."city") || ' Travel Guide'
    ]),
    "seoDescription" = "_seo_fit_description"(
        CASE
            WHEN COALESCE(TRIM(d."tagline"), '') <> '' THEN "_seo_strip_stop"(d."tagline")
            ELSE 'Plan your trip to ' || TRIM(d."city") || ', ' || TRIM(d."country")
        END
        || '. Best time to visit ' || TRIM(d."city") || ', how long to stay, local tips and things to do.'
        || CASE
            WHEN TRIM(d."fare") <> '' THEN ' Flights from Pakistan from ' || TRIM(d."fare") || '.'
            ELSE ''
        END
    );

ALTER TABLE "Destination"
    ALTER COLUMN "seoTitle" SET NOT NULL,
    ALTER COLUMN "seoDescription" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Activity
-- ---------------------------------------------------------------------------
ALTER TABLE "Activity"
    ADD COLUMN "seoTitle" TEXT,
    ADD COLUMN "seoDescription" TEXT;

WITH source AS (
    SELECT
        a."id",
        TRIM(a."title") AS title,
        TRIM(d."city") AS city,
        TRIM(a."cost") AS cost,
        TRIM(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(a."description", ''), '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g')) AS plain
    FROM "Activity" a
    JOIN "Destination" d ON d."id" = a."destinationId"
)
UPDATE "Activity" AS a
SET
    "seoTitle" = "_seo_fit_title"(ARRAY[
        s.title || ' in ' || s.city || ' – Tickets & Prices',
        s.title || ' – Tickets & Prices',
        s.title
    ]),
    "seoDescription" = "_seo_fit_description"(
        CASE
            WHEN s.plain <> '' THEN "_seo_strip_stop"(COALESCE(SUBSTRING(s.plain FROM '^(.*?[.!?])(\s|$)'), s.plain))
            ELSE 'Discover ' || s.title || ' in ' || s.city
        END
        || '.'
        || CASE WHEN s.cost <> '' THEN ' From ' || s.cost || '.' ELSE '' END
        || ' Check what''s included and book with a ' || "_seo_brand"() || ' travel adviser.'
    )
FROM source s
WHERE s."id" = a."id";

ALTER TABLE "Activity"
    ALTER COLUMN "seoTitle" SET NOT NULL,
    ALTER COLUMN "seoDescription" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- UmrahPackage
-- ---------------------------------------------------------------------------
ALTER TABLE "UmrahPackage"
    ADD COLUMN "seoTitle" TEXT,
    ADD COLUMN "seoDescription" TEXT;

UPDATE "UmrahPackage" AS p
SET
    "seoTitle" = "_seo_fit_title"(ARRAY[
        TRIM(p."title") || ' – ' || (p."makkahNights" + p."madinahNights") || ' Nights from ' || TRIM(p."departureCity"),
        CASE
            WHEN p."title" ~* 'umrah' THEN TRIM(p."title") || ' – ' || (p."makkahNights" + p."madinahNights") || ' Nights'
            ELSE TRIM(p."title") || ' – ' || (p."makkahNights" + p."madinahNights") || '-Night Umrah'
        END,
        TRIM(p."title")
    ]),
    "seoDescription" = "_seo_fit_description"(
        (p."makkahNights" + p."madinahNights") || '-night Umrah from ' || TRIM(p."departureCity") || ': '
        || p."makkahNights" || ' nights Makkah, ' || p."madinahNights" || ' nights Madinah.'
        || CASE
            WHEN COALESCE(TRIM(p."hotelSummary"), '') <> '' THEN ' ' || "_seo_strip_stop"(p."hotelSummary") || '.'
            ELSE ''
        END
        || CASE
            WHEN p."basePrice" > 0 THEN ' From ' || p."currency" || ' ' || TO_CHAR(ROUND(p."basePrice"), 'FM999,999,999,990') || ' per person.'
            ELSE ''
        END
        || ' Departs ' || TO_CHAR(p."startDate" AT TIME ZONE 'UTC', 'FMDD Mon YYYY') || '.'
    );

ALTER TABLE "UmrahPackage"
    ALTER COLUMN "seoTitle" SET NOT NULL,
    ALTER COLUMN "seoDescription" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Visa countries (AdminSetting "visa_countries" JSON array)
-- ---------------------------------------------------------------------------
UPDATE "AdminSetting" AS s
SET "value" = (
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN jsonb_typeof(v.item) <> 'object' THEN v.item
            ELSE v.item || jsonb_build_object(
                'seoTitle', COALESCE(NULLIF(TRIM(v.item ->> 'seoTitle'), ''), "_seo_fit_title"(ARRAY[
                    TRIM(v.item ->> 'country') || ' ' || v.label || ' from Pakistan – Requirements & Fees',
                    TRIM(v.item ->> 'country') || ' Visa from Pakistan – Requirements & Fees',
                    TRIM(v.item ->> 'country') || ' ' || v.label || ' – Requirements & Fees',
                    TRIM(v.item ->> 'country') || ' ' || v.label
                ])),
                'seoDescription', COALESCE(NULLIF(TRIM(v.item ->> 'seoDescription'), ''), "_seo_fit_description"(
                    'Apply for a ' || TRIM(v.item ->> 'country') || ' ' || v.label || ' from Pakistan: '
                    || TRIM(COALESCE(v.item ->> 'duration', '')) || ' stay, '
                    || CASE
                        WHEN TRIM(COALESCE(v.item ->> 'entry', '')) ~* 'entry$' THEN LOWER(TRIM(v.item ->> 'entry'))
                        ELSE TRIM(COALESCE(v.item ->> 'entry', '')) || ' entry'
                    END
                    || '.'
                    || CASE
                        WHEN TRIM(COALESCE(v.item ->> 'netCost', '')) <> '' THEN ' Fees from ' || TRIM(v.item ->> 'netCost') || '.'
                        ELSE ''
                    END
                    || ' Document checklist and expert help with your application.'
                ))
            )
        END
        ORDER BY v.ord
    ), '[]'::jsonb)::text
    FROM (
        SELECT
            e.item,
            e.ord,
            CASE WHEN e.item ->> 'visaType' = 'sticker-visa' THEN 'Sticker Visa' ELSE 'e-Visa' END AS label
        FROM jsonb_array_elements(s."value"::jsonb) WITH ORDINALITY AS e(item, ord)
    ) v
)
WHERE s."key" = 'visa_countries'
  AND jsonb_typeof(s."value"::jsonb) = 'array';

DROP FUNCTION "_seo_strip_stop"(TEXT);
DROP FUNCTION "_seo_fit_description"(TEXT);
DROP FUNCTION "_seo_fit_title"(TEXT[]);
DROP FUNCTION "_seo_brand"();
