-- Migration script to fix attendance table
-- Run this in your MySQL/MariaDB database (phpMyAdmin or command line)

USE `atte`;

-- Backup existing attendance data if any
CREATE TABLE IF NOT EXISTS `attendance_backup` AS SELECT * FROM `attendance`;

-- Drop the old attendance table
DROP TABLE IF EXISTS `attendance`;

-- Create the new attendance table with proper columns
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(100) NOT NULL,
  `unit_id` INT NOT NULL,
  `att_date` DATE NOT NULL,
  `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'absent',
  `cat` DECIMAL(6,2) DEFAULT 0,
  `class` DECIMAL(6,2) DEFAULT 0,
  `exam` DECIMAL(6,2) DEFAULT 0,
  `total` DECIMAL(6,2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attendance` (`student_id`, `unit_id`, `att_date`),
  INDEX `idx_date` (`att_date`),
  INDEX `idx_unit_date` (`unit_id`, `att_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If you had old data in attendance_backup and want to restore it, 
-- you'll need to manually map it to the new structure
-- Example (adjust as needed):
-- INSERT INTO attendance (student_id, unit_id, att_date, status)
-- SELECT student_id, 1, att_date, status FROM attendance_backup;
