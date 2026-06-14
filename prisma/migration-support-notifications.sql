-- ============================================================
-- Migration: support_tickets, support_messages, notifications
-- Run manually against the MySQL database.
-- ============================================================

-- ─── 1. Enums (MySQL ENUM columns are declared inline on each table) ──────────
-- MySQL does not have standalone ENUM types; ENUMs are defined per-column.
-- The Prisma schema maps them to ENUM columns directly.

-- ─── 2. Table: support_tickets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `subject`    VARCHAR(255) NOT NULL,
  `category`   ENUM('technical','billing','delivery','general') NOT NULL DEFAULT 'general',
  `status`     ENUM('open','in_progress','resolved','closed')   NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `support_tickets_user_id_idx`   (`user_id`),
  INDEX `support_tickets_status_idx`    (`status`),

  CONSTRAINT `support_tickets_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. Table: support_messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `ticket_id`  INT         NOT NULL,
  `sender_id`  INT         NOT NULL,
  `body`       LONGTEXT    NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `support_messages_ticket_id_idx` (`ticket_id`),

  CONSTRAINT `support_messages_ticket_id_fkey`
    FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `support_messages_sender_id_fkey`
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. Table: notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `user_id`     INT          NOT NULL,
  `type`        ENUM(
                  'quote_submitted',
                  'quote_status_changed',
                  'order_status_changed',
                  'appointment_status_changed',
                  'ticket_replied',
                  'ticket_resolved',
                  'general'
                ) NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `body`        VARCHAR(500) NOT NULL,
  `entity_id`   INT          NULL,
  `entity_type` VARCHAR(50)  NULL,
  `read`        TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `notifications_user_id_read_idx` (`user_id`, `read`),

  CONSTRAINT `notifications_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
