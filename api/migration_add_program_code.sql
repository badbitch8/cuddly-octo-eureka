-- Migration script to add program_code column to students and units tables
-- Run this in your MySQL/MariaDB database (phpMyAdmin or command line)

USE `atte`;

-- Add program_code to units table
ALTER TABLE `units`
ADD COLUMN `program_code` VARCHAR(40) AFTER `title`,
ADD COLUMN `year_of_study` INT AFTER `program_code`,
ADD INDEX `idx_program` (`program_code`);

-- Add program_code and year_of_study to students table
ALTER TABLE `students`
ADD COLUMN `reg_no` VARCHAR(100) UNIQUE AFTER `name`,
ADD COLUMN `year_of_study` INT AFTER `registration`,
ADD COLUMN `program_code` VARCHAR(40) AFTER `year_of_study`,
ADD INDEX `idx_program` (`program_code`);

-- Optional: Update existing data with sample program codes
-- UPDATE units SET program_code = 'BIT' WHERE unit_code LIKE 'BIT%';
-- UPDATE students SET program_code = 'BIT', year_of_study = 1 WHERE id > 0;

SELECT 'Migration completed successfully!' AS status;
