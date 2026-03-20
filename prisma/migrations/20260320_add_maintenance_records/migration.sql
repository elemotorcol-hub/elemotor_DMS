-- CreateTable
CREATE TABLE `maintenance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `workshop_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `rating` TINYINT NULL,
    `comment` TEXT NULL,
    `cost` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `maintenance_records_order_id_idx`(`order_id`),
    INDEX `maintenance_records_user_id_idx`(`user_id`),
    INDEX `maintenance_records_workshop_id_idx`(`workshop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
