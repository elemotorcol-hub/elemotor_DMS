-- Step 1: Add public_id and created_at to images table
ALTER TABLE `images`
  ADD COLUMN `public_id` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Step 2: Add public_id, created_at to models_3d; make format and lod_level nullable
ALTER TABLE `models_3d`
  ADD COLUMN `public_id` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `format` ENUM('glb') NULL,
  MODIFY `lod_level` ENUM('low', 'medium', 'high') NULL;

-- Step 3: Add unique constraint on models_3d.trim_id (enforce one 3D model per trim)
ALTER TABLE `models_3d`
  ADD UNIQUE INDEX `models_3d_trim_id_key` (`trim_id`);

-- Note: Existing dev-seed rows will have public_id = '' (empty string).
-- All new rows inserted via the upload endpoints will always carry a real Cloudinary publicId.
