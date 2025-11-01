-- MySQL schema for XAMPP (MariaDB compatible) - Extended for MUT 3D Attendance System
CREATE DATABASE IF NOT EXISTS `atte` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `atte`;

-- Users table for all roles (students, faculty, admins)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'faculty', 'admin') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `students` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `reg_no` VARCHAR(50) DEFAULT NULL,
  `year_of_study` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Courses table (refactored from units, with faculty and year)
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `faculty_id` INT UNSIGNED DEFAULT NULL,
  `year_of_study` INT DEFAULT NULL,
  `schedule` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`faculty_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_code` (`code`),
  INDEX `idx_year` (`year_of_study`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_enrollment` (`student_id`, `course_id`),
  INDEX `idx_student` (`student_id`),
  INDEX `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance records (removed - see unified table below)

-- Sample data for Murang'a University (MUT) - passwords: 'password' (hashed)
INSERT IGNORE INTO `users` (`name`, `email`, `password_hash`, `role`) VALUES
('Admin MUT', 'admin@mut.ac.ke', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Faculty Jane Doe', 'jane.doe@mut.ac.ke', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty'),
('Student Alice K', 'alice.k@mut.ac.ke', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Student Bob M', 'bob.m@mut.ac.ke', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

INSERT IGNORE INTO `students` (`user_id`, `reg_no`, `year_of_study`) VALUES
(3, 'MUT/001/2023', 1),
(4, 'MUT/002/2023', 1);

INSERT IGNORE INTO `courses` (`code`, `title`, `faculty_id`, `year_of_study`) VALUES
('BIT 101', 'Introduction to Computing', 2, 1),
('ENG 201', 'Engineering Mathematics', 2, 2);

INSERT IGNORE INTO `enrollments` (`student_id`, `course_id`) VALUES
(1, 1), -- Alice in BIT 101
(2, 1); -- Bob in BIT 101

-- lecturers
CREATE TABLE IF NOT EXISTS `lecturers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(190) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `school_id` VARCHAR(80),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- units
CREATE TABLE IF NOT EXISTS `units` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `unit_code` VARCHAR(40) NOT NULL UNIQUE,
  `name` VARCHAR(190) NOT NULL,
  `title` VARCHAR(255),
  `program_code` VARCHAR(40),
  `year_of_study` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_program` (`program_code`)
) ENGINE=InnoDB;

-- students
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(190) NOT NULL,
  `reg_no` VARCHAR(100) UNIQUE,
  `registration` VARCHAR(100) UNIQUE,
  `year_of_study` INT,
  `program_code` VARCHAR(40),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_program` (`program_code`)
) ENGINE=InnoDB;

-- enrollments (students per unit)
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `unit_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `student_unit` (`student_id`, `unit_id`)
) ENGINE=InnoDB;

-- attendance (unified table with date support)
CREATE TABLE IF NOT EXISTS `attendance` (
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
) ENGINE=InnoDB;


