-- Quick test data for debugging
USE `atte`;

-- Insert sample units
INSERT INTO units (unit_code, name, title, year_of_study, program_code) VALUES
('CS101', 'Intro to Programming', 'Introduction to Programming', 1, 'BIT'),
('CS201', 'Data Structures', 'Data Structures and Algorithms', 2, 'BIT'),
('IT101', 'Networking', 'Computer Networks', 1, 'IT')
ON DUPLICATE KEY UPDATE unit_code=unit_code;

-- Insert sample students
INSERT INTO students (name, reg_no, registration, year_of_study, program_code) VALUES
('Alice Johnson', 'BIT/001/2023', 'BIT/001/2023', 1, 'BIT'),
('Bob Smith', 'BIT/002/2023', 'BIT/002/2023', 1, 'BIT'),
('Carol White', 'BIT/003/2023', 'BIT/003/2023', 2, 'BIT'),
('David Brown', 'IT/001/2023', 'IT/001/2023', 1, 'IT')
ON DUPLICATE KEY UPDATE name=name;

SELECT 'Test data inserted successfully!' AS status;

-- Verify data
SELECT 'Units:' AS info;
SELECT * FROM units;

SELECT 'Students:' AS info;
SELECT * FROM students;
