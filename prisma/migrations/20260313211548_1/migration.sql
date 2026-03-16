/*
  Warnings:

  - You are about to alter the column `vin` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(17)`.

*/
-- AlterTable
ALTER TABLE `images` ALTER COLUMN `public_id` DROP DEFAULT;

-- AlterTable
ALTER TABLE `models_3d` ALTER COLUMN `public_id` DROP DEFAULT;

-- AlterTable
ALTER TABLE `order_status_history` ADD COLUMN `previous_status` ENUM('confirmed', 'port_origin', 'transit', 'customs', 'nationalization', 'ready', 'delivered') NULL,
    MODIFY `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `notes` TEXT NULL,
    MODIFY `vin` VARCHAR(17) NULL;

-- CreateTable
CREATE TABLE `tracking_counters` (
    `year` INTEGER NOT NULL,
    `last_seq` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orders_status_idx` ON `orders`(`status`);

-- CreateIndex
CREATE INDEX `orders_created_at_idx` ON `orders`(`created_at`);
