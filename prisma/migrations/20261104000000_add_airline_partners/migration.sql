-- Homepage airline partners move from the airline_logos AdminSetting JSON
-- into their own table so admins manage them under /admin/airline-partners.
CREATE TABLE "AirlinePartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "storagePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirlinePartner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AirlinePartner_isActive_sortOrder_idx" ON "AirlinePartner"("isActive", "sortOrder");

-- Carry over logos already saved from the old admin page. Their sortOrder
-- could be a Date.now() timestamp, so it is renumbered by position.
INSERT INTO "AirlinePartner" ("id", "name", "logoUrl", "storagePath", "isActive", "sortOrder", "updatedAt")
SELECT
    gen_random_uuid()::text,
    TRIM(entry->>'name'),
    TRIM(entry->>'src'),
    NULLIF(TRIM(COALESCE(entry->>'storagePath', '')), ''),
    COALESCE((entry->>'isActive')::boolean, true),
    ROW_NUMBER() OVER (ORDER BY (entry->>'sortOrder')::numeric NULLS LAST, position)::int,
    CURRENT_TIMESTAMP
FROM "AdminSetting",
     jsonb_array_elements("value"::jsonb) WITH ORDINALITY AS logos(entry, position)
WHERE "key" = 'airline_logos'
  AND jsonb_typeof("value"::jsonb) = 'array'
  AND COALESCE(TRIM(entry->>'name'), '') <> ''
  AND COALESCE(TRIM(entry->>'src'), '') <> '';

-- No saved logos: seed the carriers the homepage showed until now.
INSERT INTO "AirlinePartner" ("id", "name", "logoUrl", "isActive", "sortOrder", "updatedAt")
SELECT gen_random_uuid()::text, seed.name, seed.logo_url, true, seed.sort_order, CURRENT_TIMESTAMP
FROM (VALUES
    ('Emirates', '/airlines/ek.gif', 1),
    ('Qatar Airways', '/airlines/qr.gif', 2),
    ('Etihad Airways', '/airlines/ey.gif', 3),
    ('Turkish Airlines', '/airlines/tk.gif', 4),
    ('British Airways', '/airlines/ba.gif', 5),
    ('Saudi', '/airlines/sv.gif', 6),
    ('Air Arabia', '/airlines/Air-Arabia-Logo.jpg', 7),
    ('Flydubai', '/airlines/fz.png', 8),
    ('PIA', '/airlines/pk.png', 9),
    ('Airblue', '/airlines/Airblue_Logo.png', 10),
    ('Serene Air', '/airlines/serene-logo.jpg', 11),
    ('Kuwait Airways', '/airlines/ku.gif', 12)
) AS seed(name, logo_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "AirlinePartner");

DELETE FROM "AdminSetting" WHERE "key" = 'airline_logos';
