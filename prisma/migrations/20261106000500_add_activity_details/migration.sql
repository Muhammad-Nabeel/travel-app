-- Activity detail content (key facts, highlights, inclusions, what to expect,
-- know before you go, cancellation policy, FAQs), edited in /admin/activities.
-- Existing activities start empty; scripts/import-activity-details.js fills them.
ALTER TABLE "Activity"
  ADD COLUMN "duration" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "bestTimeToVisit" TEXT,
  ADD COLUMN "highlights" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "included" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "excluded" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "itinerary" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "importantInfo" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "cancellationPolicy" TEXT,
  ADD COLUMN "faqs" JSONB NOT NULL DEFAULT '[]';
