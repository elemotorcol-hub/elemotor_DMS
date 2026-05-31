-- CreateTable
CREATE TABLE `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `logo_url` VARCHAR(500) NULL,
    `country` VARCHAR(100) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `brands_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `models` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `type` ENUM('SUV', 'Sedan', 'Hatchback', 'Pickup') NOT NULL,
    `year` INTEGER NOT NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(15, 2) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `models_slug_key`(`slug`),
    INDEX `models_brand_id_idx`(`brand_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trims` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `model_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(15, 2) NULL,
    `available_quantity` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('stock', 'transit', 'order') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trims_model_id_idx`(`model_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trim_id` INTEGER NOT NULL,
    `battery_kwh` DECIMAL(8, 2) NULL,
    `range_cltc_km` INTEGER NULL,
    `range_wltp_km` INTEGER NULL,
    `horsepower` INTEGER NULL,
    `torque` INTEGER NULL,
    `zero_to_100` DECIMAL(5, 2) NULL,
    `top_speed` INTEGER NULL,
    `charge_time_30_80` VARCHAR(100) NULL,
    `trunk_liters` INTEGER NULL,
    `length_mm` INTEGER NULL,
    `width_mm` INTEGER NULL,
    `height_mm` INTEGER NULL,
    `wheelbase_mm` INTEGER NULL,
    `curb_weight_kg` INTEGER NULL,
    `software_version` INTEGER NULL,
    `adas_level` INTEGER NULL,
    `screen_size` INTEGER NULL,
    `kwh_per_100km` DECIMAL(6, 2) NULL,

    UNIQUE INDEX `specs_trim_id_key`(`trim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trim_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `hex_code` CHAR(6) NOT NULL,
    `type` ENUM('exterior', 'interior') NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `swatch_url` VARCHAR(500) NULL,

    INDEX `colors_trim_id_idx`(`trim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trim_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `type` ENUM('gallery', 'hero', 'interior', 'exterior', '360') NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `images_trim_id_idx`(`trim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `models_3d` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trim_id` INTEGER NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_size_mb` DECIMAL(8, 2) NULL,
    `format` ENUM('glb') NOT NULL,
    `draco_compressed` BOOLEAN NOT NULL DEFAULT false,
    `lod_level` ENUM('low', 'medium', 'high') NOT NULL,

    INDEX `models_3d_trim_id_idx`(`trim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NULL,
    `cedula` VARCHAR(50) NULL,
    `city` VARCHAR(100) NULL,
    `role` ENUM('client', 'admin') NOT NULL DEFAULT 'client',
    `google_id` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `trim_id` INTEGER NOT NULL,
    `color_id` INTEGER NOT NULL,
    `tracking_code` VARCHAR(50) NULL,
    `status` ENUM('confirmed', 'port_origin', 'transit', 'customs', 'nationalization', 'ready', 'delivered') NOT NULL,
    `estimated_delivery` DATE NULL,
    `vin` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_tracking_code_key`(`tracking_code`),
    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_trim_id_idx`(`trim_id`),
    INDEX `orders_color_id_idx`(`color_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `status` ENUM('confirmed', 'port_origin', 'transit', 'customs', 'nationalization', 'ready', 'delivered') NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    INDEX `order_status_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `city` VARCHAR(100) NULL,
    `model_id` INTEGER NULL,
    `trim_id` INTEGER NULL,
    `budget_range` DECIMAL(15, 2) NULL,
    `preferred_channel` ENUM('whatsapp', 'call', 'email') NOT NULL,
    `message` TEXT NULL,
    `reference_code` VARCHAR(50) NULL,
    `status` ENUM('pending', 'responded', 'closed') NOT NULL DEFAULT 'pending',
    `utm_source` VARCHAR(100) NULL,
    `utm_medium` VARCHAR(100) NULL,
    `utm_campaign` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quotes_reference_code_key`(`reference_code`),
    INDEX `quotes_user_id_idx`(`user_id`),
    INDEX `quotes_model_id_idx`(`model_id`),
    INDEX `quotes_trim_id_idx`(`trim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('invoice', 'soat', 'import_cert', 'property_card', 'manual', 'other') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `uploaded_by` ENUM('admin', 'client') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_order_id_idx`(`order_id`),
    INDEX `documents_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `phone` VARCHAR(50) NULL,
    `whatsapp` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `google_maps_url` VARCHAR(500) NULL,
    `rating` DECIMAL(2, 1) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workshop_id` INTEGER NOT NULL,
    `service_type` ENUM('maintenance', 'chargers', 'body_paint', 'electric_diagnostics', 'tires') NOT NULL,

    INDEX `workshop_services_workshop_id_idx`(`workshop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_hours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workshop_id` INTEGER NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `open_time` VARCHAR(8) NULL,
    `close_time` VARCHAR(8) NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `workshop_hours_workshop_id_idx`(`workshop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workshop_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `workshop_images_workshop_id_idx`(`workshop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `electricity_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(100) NOT NULL,
    `price_per_kwh_cop` DECIMAL(10, 2) NOT NULL,
    `source` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(100) NOT NULL,
    `fuel_type` ENUM('regular', 'premium') NOT NULL,
    `price_per_gallon_cop` DECIMAL(10, 2) NOT NULL,
    `source` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `models` ADD CONSTRAINT `models_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trims` ADD CONSTRAINT `trims_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specs` ADD CONSTRAINT `specs_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colors` ADD CONSTRAINT `colors_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `models_3d` ADD CONSTRAINT `models_3d_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_color_id_fkey` FOREIGN KEY (`color_id`) REFERENCES `colors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_trim_id_fkey` FOREIGN KEY (`trim_id`) REFERENCES `trims`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_services` ADD CONSTRAINT `workshop_services_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_hours` ADD CONSTRAINT `workshop_hours_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_images` ADD CONSTRAINT `workshop_images_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
