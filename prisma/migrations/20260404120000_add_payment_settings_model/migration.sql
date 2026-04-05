-- CreateTable
CREATE TABLE `PaymentSetting` (
    `id` VARCHAR(191) NOT NULL,
    `serviceChargePercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `enableWise` BOOLEAN NOT NULL DEFAULT true,
    `enableStripe` BOOLEAN NOT NULL DEFAULT true,
    `enablePaypal` BOOLEAN NOT NULL DEFAULT true,
    `enableSumup` BOOLEAN NOT NULL DEFAULT true,
    `enablePaymob` BOOLEAN NOT NULL DEFAULT true,
    `enableCashOnDelivery` BOOLEAN NOT NULL DEFAULT true,
    `enablePayAtBranch` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
