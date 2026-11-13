-- Indexes matching how the site reads each table: listings filter on a
-- published/active flag and sort by display order or date, and the admin
-- booking list sorts newest first with no filter.

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "BookingEvent_actorId_idx" ON "BookingEvent"("actorId");

-- CreateIndex
CREATE INDEX "UmrahPackage_status_startDate_idx" ON "UmrahPackage"("status", "startDate");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Destination_isActive_sortOrder_idx" ON "Destination"("isActive", "sortOrder");

-- CreateIndex (replaces Activity_destinationId_idx, which it covers)
CREATE INDEX "Activity_destinationId_isActive_sortOrder_idx" ON "Activity"("destinationId", "isActive", "sortOrder");

-- DropIndex
DROP INDEX "Activity_destinationId_idx";

-- CreateIndex
CREATE INDEX "Activity_isActive_sortOrder_idx" ON "Activity"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomerReview_isPublished_sortOrder_idx" ON "CustomerReview"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "Branch_isActive_sortOrder_idx" ON "Branch"("isActive", "sortOrder");
