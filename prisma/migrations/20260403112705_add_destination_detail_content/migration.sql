-- AlterTable
ALTER TABLE `destination` ADD COLUMN `bestTimeToVisit` VARCHAR(191) NULL,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `highlights` JSON NULL,
    ADD COLUMN `idealStay` VARCHAR(191) NULL,
    ADD COLUMN `language` VARCHAR(191) NULL,
    ADD COLUMN `overview` TEXT NULL,
    ADD COLUMN `tagline` VARCHAR(191) NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL,
    ADD COLUMN `travelTips` JSON NULL;
