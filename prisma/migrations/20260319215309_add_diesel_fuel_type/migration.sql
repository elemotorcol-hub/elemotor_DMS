-- AlterTable
ALTER TABLE `fuel_prices` MODIFY `fuel_type` ENUM('regular', 'premium', 'diesel') NOT NULL;
