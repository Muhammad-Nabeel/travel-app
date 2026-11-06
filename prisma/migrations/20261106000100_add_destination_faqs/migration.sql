-- Destination FAQs, edited in /admin/destinations and shown on the page
-- (with FAQPage structured data). Existing destinations start with none.
ALTER TABLE "Destination" ADD COLUMN "faqs" JSONB NOT NULL DEFAULT '[]';
