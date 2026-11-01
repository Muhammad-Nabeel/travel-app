-- Tour packages move from src/lib/mock-data.ts into the database so admins
-- can create, edit and delete them, starting with the former demo packages.
CREATE TABLE "TourPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "tourType" TEXT NOT NULL DEFAULT 'cultural',
    "duration" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "pricePerAdult" DECIMAL(10,2) NOT NULL,
    "pricePerChild" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TourPackage_slug_key" ON "TourPackage"("slug");

CREATE INDEX "TourPackage_isActive_sortOrder_idx" ON "TourPackage"("isActive", "sortOrder");

-- Starter packages (the former src/lib/mock-data.ts demo tours) so the tour
-- pages are not empty after deploy. SEO copy matches suggestTourPackageSeo()
-- in src/lib/seo-suggestions.ts and prisma/seed.js. Admins can edit or
-- delete them under /admin/tour-packages.
INSERT INTO "TourPackage" (
    "id", "slug", "title", "destination", "tourType", "duration", "description",
    "highlights", "imageUrl", "pricePerAdult", "pricePerChild", "currency",
    "rating", "reviewCount", "sortOrder", "isActive", "seoTitle", "seoDescription",
    "updatedAt"
) VALUES
    ('tp_golden_dubai_explorer', 'golden-dubai-explorer', 'Golden Dubai Explorer', 'Dubai, UAE', 'luxury', 7, 'Explore Dubai, UAE with our 7-day Golden Dubai Explorer itinerary featuring Burj Khalifa visit and Desert safari.', '["Burj Khalifa visit","Desert safari","Dhow cruise dinner","City tour"]'::jsonb, '/tour-dubai.jpg', 1299, 649, 'USD', 4.8, 312, 1, true, 'Golden Dubai Explorer – 7-Day Dubai Package', 'Explore Dubai, UAE with our 7-day Golden Dubai Explorer itinerary featuring Burj Khalifa visit and Desert safari. From USD 1,299 per adult.', CURRENT_TIMESTAMP),
    ('tp_istanbul_heritage_tour', 'istanbul-heritage-tour', 'Istanbul Heritage Tour', 'Istanbul, Turkey', 'cultural', 10, 'Explore Istanbul, Turkey with our 10-day Istanbul Heritage Tour itinerary featuring Hagia Sophia and Grand Bazaar.', '["Hagia Sophia","Grand Bazaar","Bosphorus cruise","Cappadocia day trip"]'::jsonb, '/tour-istanbul.jpg', 980, 490, 'USD', 4.7, 218, 2, true, 'Istanbul Heritage Tour – 10-Day Istanbul Package', 'Explore Istanbul, Turkey with our 10-day Istanbul Heritage Tour itinerary featuring Hagia Sophia and Grand Bazaar. From USD 980 per adult.', CURRENT_TIMESTAMP),
    ('tp_bali_family_escape', 'bali-family-escape', 'Bali Family Escape', 'Bali, Indonesia', 'family', 7, 'Explore Bali, Indonesia with our 7-day Bali Family Escape itinerary featuring Ubud rice terraces and Tanah Lot temple.', '["Ubud rice terraces","Tanah Lot temple","Water park","Cooking class"]'::jsonb, '/tour-bali.jpg', 850, 425, 'USD', 4.9, 540, 3, true, 'Bali Family Escape – 7-Day Bali Package', 'Explore Bali, Indonesia with our 7-day Bali Family Escape itinerary featuring Ubud rice terraces and Tanah Lot temple. From USD 850 per adult.', CURRENT_TIMESTAMP),
    ('tp_maldives_paradise_retreat', 'maldives-paradise-retreat', 'Maldives Paradise Retreat', 'Maldives', 'luxury', 5, 'Explore Maldives with our 5-day Maldives Paradise Retreat itinerary featuring Overwater bungalow and Snorkelling.', '["Overwater bungalow","Snorkelling","Sunset cruise","Spa package"]'::jsonb, '/tour-maldives.jpg', 2100, 1050, 'USD', 5, 187, 4, true, 'Maldives Paradise Retreat – 5-Day Package', 'Explore Maldives with our 5-day Maldives Paradise Retreat itinerary featuring Overwater bungalow and Snorkelling. From USD 2,100 per adult.', CURRENT_TIMESTAMP),
    ('tp_cairo_nile_adventure', 'cairo-nile-adventure', 'Cairo & Nile Adventure', 'Cairo, Egypt', 'adventure', 10, 'Explore Cairo, Egypt with our 10-day Cairo & Nile Adventure itinerary featuring Pyramids of Giza and Nile cruise.', '["Pyramids of Giza","Nile cruise","Luxor temples","Red Sea day trip"]'::jsonb, '/tour-cairo.jpg', 760, 380, 'USD', 4.6, 293, 5, true, 'Cairo & Nile Adventure – 10-Day Cairo Package', 'Explore Cairo, Egypt with our 10-day Cairo & Nile Adventure itinerary featuring Pyramids of Giza and Nile cruise. From USD 760 per adult.', CURRENT_TIMESTAMP),
    ('tp_tokyo_discovery', 'tokyo-discovery', 'Tokyo Discovery', 'Tokyo, Japan', 'cultural', 14, 'Explore Tokyo, Japan with our 14-day Tokyo Discovery itinerary featuring Shibuya crossing and Mt. Fuji day trip.', '["Shibuya crossing","Mt. Fuji day trip","Kyoto temples","Hiroshima memorial"]'::jsonb, '/tour-tokyo.webp', 1850, 925, 'USD', 4.9, 411, 6, true, 'Tokyo Discovery – 14-Day Tokyo Package', 'Explore Tokyo, Japan with our 14-day Tokyo Discovery itinerary featuring Shibuya crossing and Mt. Fuji day trip. From USD 1,850 per adult.', CURRENT_TIMESTAMP);
