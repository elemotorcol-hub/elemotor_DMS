-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('client', 'admin', 'super_admin') NOT NULL DEFAULT 'client';
