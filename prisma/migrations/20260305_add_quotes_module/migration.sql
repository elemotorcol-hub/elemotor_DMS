-- ============================================================
-- Migration: add_quotes_module  (Phase 1 of 2)
-- Phase 1: Expand enum first by adding all old + new values,
--          then remap old 'closed' rows, then remove old value.
-- ============================================================

-- STEP 1: Expand enum to include BOTH old and new values so no rows are invalid
ALTER TABLE `quotes`
  MODIFY COLUMN `status` ENUM(
    'pending',
    'contacted',
    'responded',
    'negotiation',
    'closed_won',
    'closed_lost',
    'closed'
  ) NOT NULL DEFAULT 'pending';

-- STEP 2: Migrate old 'closed' rows to 'closed_won'
UPDATE `quotes` SET `status` = 'closed_won' WHERE `status` = 'closed';

-- STEP 3: Remove the old 'closed' value by dropping it from enum
ALTER TABLE `quotes`
  MODIFY COLUMN `status` ENUM(
    'pending',
    'contacted',
    'responded',
    'negotiation',
    'closed_won',
    'closed_lost'
  ) NOT NULL DEFAULT 'pending';

-- STEP 4: Create quote_counters table
CREATE TABLE IF NOT EXISTS `quote_counters` (
  `year`     INT NOT NULL,
  `last_seq` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`year`)
);

-- STEP 5: Add new columns to quotes
ALTER TABLE `quotes`
  ADD COLUMN `assigned_to`  INT          NULL AFTER `user_id`,
  ADD COLUMN `notes`        TEXT         NULL AFTER `message`,
  ADD COLUMN `source`       VARCHAR(100) NULL AFTER `notes`;

-- STEP 6: Add foreign key for assigned_to → users
ALTER TABLE `quotes`
  ADD CONSTRAINT `quotes_assigned_to_fkey`
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- STEP 7: Add indexes
CREATE INDEX `quotes_assigned_to_idx`  ON `quotes`(`assigned_to`);
CREATE INDEX `quotes_status_idx`       ON `quotes`(`status`);
CREATE INDEX `quotes_source_idx`       ON `quotes`(`source`);
CREATE INDEX `quotes_created_at_idx`   ON `quotes`(`created_at`);
