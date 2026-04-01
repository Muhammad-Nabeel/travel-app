-- CreateTable
CREATE TABLE `TourPackage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `destination` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `departureCity` VARCHAR(191) NOT NULL,
    `highlights` JSON NOT NULL,
    `inclusions` JSON NOT NULL,
    `exclusions` JSON NOT NULL,
    `basePrice` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
    `seatsAvailable` INTEGER NOT NULL DEFAULT 0,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TourPackage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
