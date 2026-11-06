-- Activity descriptions are shown on the page and in structured data, so they
-- are required instead of falling back to generated text. All existing rows
-- already have one; this guard fails loudly if that ever stops being true.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Activity" WHERE "description" IS NULL OR btrim("description") = '') THEN
    RAISE EXCEPTION 'Activity rows without a description exist; add descriptions in /admin/activities first.';
  END IF;
END $$;

ALTER TABLE "Activity" ALTER COLUMN "description" SET NOT NULL;
