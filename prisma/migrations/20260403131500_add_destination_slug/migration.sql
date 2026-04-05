-- AlterTable
ALTER TABLE `destination`
    ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Destination_slug_key` ON `destination`(`slug`);
