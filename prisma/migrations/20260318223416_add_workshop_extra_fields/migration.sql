-- AlterTable
ALTER TABLE `workshops` ADD COLUMN `amenities` JSON NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT true;
