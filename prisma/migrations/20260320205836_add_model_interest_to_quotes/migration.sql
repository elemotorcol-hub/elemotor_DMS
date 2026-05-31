-- AlterTable
ALTER TABLE `quotes` ADD COLUMN `country` VARCHAR(100) NULL,
    ADD COLUMN `model_interest` VARCHAR(255) NULL,
    ADD COLUMN `tracking_code` VARCHAR(50) NULL;
