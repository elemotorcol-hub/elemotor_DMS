-- CreateEnum
CREATE TABLE IF NOT EXISTS `__temp_enum_check` (`id` INT);
DROP TABLE IF EXISTS `__temp_enum_check`;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `cover_url` VARCHAR(500) NULL,
    `cover_public_id` VARCHAR(255) NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `author_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_status_idx`(`status`),
    INDEX `posts_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
