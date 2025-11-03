USE atte;

INSERT INTO lecturers (name,email,password_hash,school_id)
VALUES ('Demo Lecturer','demo@school.edu', '{REPLACE_WITH_HASH}', 'LECT-001');

-- create unit
INSERT INTO units (unit_code,name,title) VALUES ('CSC 111','Introduction to Programming','Introduction to Programming');

-- create students
INSERT INTO students (name,registration) VALUES
('Alice Student','S1001'),
('Bob Student','S1002'),
('Carol Student','S1003');

-- enroll students to CSC 111
INSERT INTO enrollments (student_id,unit_id)
SELECT s.id, u.id FROM students s, units u WHERE u.unit_code='CSC 111' AND s.registration IN ('S1001','S1002','S1003');

-- some attendance rows (cat, class, exam, total)
-- Create student_evaluation table
CREATE TABLE IF NOT EXISTS student_evaluation (
  reg_no VARCHAR(20),
  unit_code VARCHAR(20),
  class INT DEFAULT 0,
  cat INT DEFAULT 0,
  assignment INT DEFAULT 0,
  exam INT DEFAULT 0,
  cat_score DECIMAL(5,2) DEFAULT 0,
  assignment_score DECIMAL(5,2) DEFAULT 0,
  PRIMARY KEY (reg_no, unit_code)
);

-- Alter table to change primary key if it exists with old structure
ALTER TABLE student_evaluation DROP PRIMARY KEY, ADD PRIMARY KEY (reg_no, unit_code);

INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 80, 90, 70, 80 FROM students s JOIN units u ON u.unit_code='CSC 111' WHERE s.registration='S1001';
INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 60, 75, 50, 62 FROM students s JOIN units u ON u.unit_code='CSC 111' WHERE s.registration='S1002';
INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 95, 88, 92, 92.5 FROM students s JOIN units u ON u.unit_code='CSC 111' WHERE s.registration='S1003';

-- Insert sample data into student_evaluation table
INSERT INTO student_evaluation (reg_no, class, cat, assignment, unit_code, cat_score, assignment_score) VALUES
('S1001', 10, 1, 1, 'CSC 111', 25.0, 15.0),
('S1002', 8, 1, 1, 'CSC 111', 20.0, 12.0),
('S1003', 12, 1, 1, 'CSC 111', 28.0, 18.0);
