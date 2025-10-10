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

-- Attendance records
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enrollment_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'absent',
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
  INDEX `idx_enrollment_date` (`enrollment_id`, `date`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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


