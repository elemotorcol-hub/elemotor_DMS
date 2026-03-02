-- AlterTable
ALTER TABLE `users` ADD COLUMN `otp_code` VARCHAR(10) NULL,
    ADD COLUMN `otp_expires_at` DATETIME(3) NULL,
    ADD COLUMN `password_reset_expires` DATETIME(3) NULL,
    ADD COLUMN `password_reset_token` VARCHAR(255) NULL,
    ADD COLUMN `refresh_token` VARCHAR(500) NULL;
