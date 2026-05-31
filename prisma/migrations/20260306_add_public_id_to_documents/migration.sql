-- Add public_id to documents table for Cloudinary asset tracking
ALTER TABLE `documents`
  ADD COLUMN `public_id` VARCHAR(255) NULL;
