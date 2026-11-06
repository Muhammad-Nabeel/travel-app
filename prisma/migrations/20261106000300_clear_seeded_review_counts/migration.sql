-- The original seed inserted made-up review counts for demo activities and
-- tour packages. Ratings are only shown when reviewCount > 0, so clearing the
-- seeded counts hides them until real numbers are entered in the admin.
-- Only rows still holding the exact seeded (title, reviewCount) pair are
-- touched, so counts an admin has since edited are left alone.

UPDATE "Activity" AS a
SET "reviewCount" = 0
FROM (VALUES
  ('Desert Safari Adventure', 342),
  ('Burj Khalifa Observation Deck', 1205),
  ('Corniche Sunset Walk', 289),
  ('Historic Old City Tour', 891),
  ('London Eye Experience', 3421),
  ('Petronas Towers Skybridge', 654),
  ('Walled City Food Walk', 418),
  ('Clifton Beach Evening', 512)
) AS seeded(title, count)
WHERE a."title" = seeded.title AND a."reviewCount" = seeded.count;

UPDATE "TourPackage" AS t
SET "reviewCount" = 0
FROM (VALUES
  ('Golden Dubai Explorer', 312),
  ('Istanbul Heritage Tour', 218),
  ('Bali Family Escape', 540),
  ('Maldives Paradise Retreat', 187),
  ('Cairo & Nile Adventure', 293),
  ('Tokyo Discovery', 411)
) AS seeded(title, count)
WHERE t."title" = seeded.title AND t."reviewCount" = seeded.count;
