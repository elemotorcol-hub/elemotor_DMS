CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `comment` TEXT NOT NULL,
  `rating` TINYINT NOT NULL,
  `photo_url` VARCHAR(500) NULL,
  `public_id` VARCHAR(255) NULL,
  `order_id` INT NULL,
  `approved` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `testimonials_rating_idx` (`rating`),
  INDEX `testimonials_approved_idx` (`approved`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
