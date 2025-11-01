USE atte;

INSERT INTO lecturers (name,email,password_hash,school_id)
VALUES ('Demo Lecturer','demo@school.edu', '{REPLACE_WITH_HASH}', 'LECT-001');

-- create unit
INSERT INTO units (unit_code,name,title) VALUES ('CS101','Computer Science 101','Intro to CS');

-- create students
INSERT INTO students (name,registration) VALUES
('Alice Student','S1001'),
('Bob Student','S1002'),
('Carol Student','S1003');

-- enroll students to CS101
INSERT INTO enrollments (student_id,unit_id)
SELECT s.id, u.id FROM students s, units u WHERE u.unit_code='CS101' AND s.registration IN ('S1001','S1002','S1003');

-- some attendance rows (cat, class, exam, total)
INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 80, 90, 70, 80 FROM students s JOIN units u ON u.unit_code='CS101' WHERE s.registration='S1001';
INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 60, 75, 50, 62 FROM students s JOIN units u ON u.unit_code='CS101' WHERE s.registration='S1002';
INSERT INTO attendance (student_id,unit_id,cat,`class`,exam,total)
SELECT s.id, u.id, 95, 88, 92, 92.5 FROM students s JOIN units u ON u.unit_code='CS101' WHERE s.registration='S1003';