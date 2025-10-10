<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = getPdo();

    // Basic auth check (extend for roles)
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['role'] ?? '';

    if ($method === 'GET') {
        $id = getQueryInt('id');
        $course_id = getQueryInt('course_id'); // For faculty: students in course
        if ($id !== null) {
            // Get specific student with user info
            $stmt = $pdo->prepare('
                SELECT s.id, s.reg_no, s.year_of_study, u.name, u.email, u.role, s.created_at 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?
            ');
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$student) jsonResponse(404, ['error' => 'Student not found']);
            jsonResponse(200, $student);
        } elseif ($course_id !== null && in_array($role, ['faculty', 'admin'])) {
            // Get students enrolled in course (for attendance marking)
            $stmt = $pdo->prepare('
                SELECT s.id, s.reg_no, s.year_of_study, u.name, u.email, e.id as enrollment_id 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                JOIN enrollments e ON s.id = e.student_id 
                WHERE e.course_id = ? 
                ORDER BY u.name
            ');
            $stmt->execute([$course_id]);
            jsonResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            // All students (admin) or own (student)
            if ($role === 'student' && $user_id) {
                $stmt = $pdo->prepare('
                    SELECT s.id, s.reg_no, s.year_of_study, u.name, u.email 
                    FROM students s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE u.id = ?
                ');
                $stmt->execute([$user_id]);
                jsonResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
            } else {
                $stmt = $pdo->query('
                    SELECT s.id, s.reg_no, s.year_of_study, u.name, u.email, u.role, s.created_at 
                    FROM students s 
                    JOIN users u ON s.user_id = u.id 
                    ORDER BY s.id DESC
                ');
                jsonResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        }
    }

    if ($method === 'POST') {
        $input = getJsonInput();
        $action = $input['action'] ?? 'create'; // 'create' or 'login'
        $name = trim($input['name'] ?? '');
        $email = trim(strtolower($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        $reg_no = trim($input['reg_no'] ?? '');
        $role = $input['role'] ?? 'student';
        $year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : 1;

        if ($action === 'login') {
            if ($email === '' || $password === '') {
                jsonResponse(400, ['error' => 'Email and password required']);
            }

            error_log("Login attempt for email: $email");

            $stmt = $pdo->prepare('SELECT u.id, u.name, u.email, u.role, s.id as student_id, s.reg_no, s.year_of_study FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                error_log("User not found for email: $email");
                jsonResponse(401, ['error' => 'Invalid credentials']);
            }

            // Select password_hash for verify
            $stmt_pass = $pdo->prepare('SELECT password_hash FROM users WHERE email = ?');
            $stmt_pass->execute([$email]);
            $pass_row = $stmt_pass->fetch();
            if (!$pass_row || !password_verify($password, $pass_row['password_hash'])) {
                error_log("Password verification failed for email: $email");
                jsonResponse(401, ['error' => 'Invalid credentials']);
            }

            error_log("Login successful for email: $email");

            // Start session, set token
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            $token = bin2hex(random_bytes(32)); // Simple token
            $_SESSION['token'] = $token;

            jsonResponse(200, [
                'success' => true,
                'user' => $user,
                'token' => $token
            ]);
        } elseif ($action === 'create') {
            if (!in_array($role, ['student', 'faculty', 'admin'])) {
                jsonResponse(400, ['error' => 'Invalid role']);
            }
            if ($role === 'student' && ($name === '' || $email === '' || $password === '' || $reg_no === '')) {
                jsonResponse(400, ['error' => 'Fields required for student']);
            } elseif ($role !== 'student' && ($name === '' || $email === '' || $password === '')) {
                jsonResponse(400, ['error' => 'Fields required']);
            }

            // Check email
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                jsonResponse(400, ['error' => 'Email already registered']);
            }

            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
            $stmt->execute([$name, $email, $password_hash, $role]);
            $user_id = (int)$pdo->lastInsertId();

            if ($role === 'student') {
                $stmt = $pdo->prepare('INSERT INTO students (user_id, reg_no, year_of_study) VALUES (?, ?, ?)');
                $stmt->execute([$user_id, $reg_no, $year]);
                $student_id = (int)$pdo->lastInsertId();
                jsonResponse(201, [
                    'id' => $student_id, 
                    'user_id' => $user_id,
                    'name' => $name, 
                    'email' => $email,
                    'role' => $role,
                    'reg_no' => $reg_no, 
                    'year_of_study' => $year
                ]);
            } else {
                jsonResponse(201, [
                    'user_id' => $user_id,
                    'name' => $name, 
                    'email' => $email,
                    'role' => $role
                ]);
            }
        } else {
            jsonResponse(400, ['error' => 'Invalid action']);
        }
    }

    if ($method === 'PUT') {
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        $name = isset($input['name']) ? trim($input['name']) : null;
        $email = isset($input['email']) ? trim(strtolower($input['email'])) : null;
        $reg_no = isset($input['reg_no']) ? trim($input['reg_no']) : null;
        $year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : null;

        if ($id <= 0 || ($name === null && $email === null && $reg_no === null && $year === null)) {
            jsonResponse(400, ['error' => 'id and at least one field required']);
        }

        $fields = [];
        $params = [];
        if ($name !== null) { 
            $fields[] = 'u.name = ?'; 
            $params[] = $name; 
        }
        if ($email !== null) { 
            // Check unique email
            $stmt_check = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != (SELECT user_id FROM students WHERE id = ?)');
            $stmt_check->execute([$email, $id]);
            if ($stmt_check->fetch()) {
                jsonResponse(400, ['error' => 'Email already in use']);
            }
            $fields[] = 'u.email = ?'; 
            $params[] = $email; 
        }
        if ($reg_no !== null) { $fields[] = 'reg_no = ?'; $params[] = $reg_no; }
        if ($year !== null) { $fields[] = 'year_of_study = ?'; $params[] = $year; }
        $params[] = $id;

        $sql = 'UPDATE students s JOIN users u ON s.user_id = u.id SET ' . implode(', ', $fields) . ' WHERE s.id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonResponse(200, ['updated' => $stmt->rowCount()]);
    }

    if ($method === 'DELETE' && in_array($role, ['admin'])) {
        $id = getQueryInt('id');
        if ($id === null || $id <= 0) {
            jsonResponse(400, ['error' => 'id query parameter required']);
        }
        $stmt = $pdo->prepare('DELETE FROM students WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(200, ['deleted' => $stmt->rowCount()]);
    }

    jsonResponse(405, ['error' => 'Method Not Allowed']);
} catch (PDOException $e) {
    jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
    jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}
