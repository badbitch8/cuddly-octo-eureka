<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = getPdo();

    if ($method === 'GET') {
        $id = getQueryInt('id');
        if ($id !== null) {
            $stmt = $pdo->prepare('SELECT id, name, reg_no, year_of_study, NOW() AS created_at FROM students WHERE id = ?');
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$student) jsonResponse(404, ['error' => 'Student not found']);
            jsonResponse(200, $student);
        } else {
            $stmt = $pdo->query('SELECT id, name, reg_no, year_of_study, NOW() AS created_at FROM students ORDER BY id DESC');
            jsonResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    }

    if ($method === 'POST') {
        $input = getJsonInput();
        $name = trim($input['name'] ?? '');
        $reg_no = trim($input['reg_no'] ?? '');
        $year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : 1;

        if ($name === '' || $reg_no === '') {
            jsonResponse(400, ['error' => 'name and reg_no are required']);
        }

        $stmt = $pdo->prepare('INSERT INTO students (name, reg_no, year_of_study) VALUES (?, ?, ?)');
        $stmt->execute([$name, $reg_no, $year]);
        $id = (int)$pdo->lastInsertId();

        jsonResponse(201, ['id' => $id, 'name' => $name, 'reg_no' => $reg_no, 'year_of_study' => $year]);
    }

    if ($method === 'PUT') {
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        $name = isset($input['name']) ? trim($input['name']) : null;
        $reg_no = isset($input['reg_no']) ? trim($input['reg_no']) : null;
        $year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : null;

        if ($id <= 0 || ($name === null && $reg_no === null && $year === null)) {
            jsonResponse(400, ['error' => 'id and at least one of name/reg_no/year_of_study required']);
        }

        $fields = [];
        $params = [];
        if ($name !== null) { $fields[] = 'name = ?'; $params[] = $name; }
        if ($reg_no !== null) { $fields[] = 'reg_no = ?'; $params[] = $reg_no; }
        if ($year !== null) { $fields[] = 'year_of_study = ?'; $params[] = $year; }
        $params[] = $id;

        $sql = 'UPDATE students SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonResponse(200, ['updated' => $stmt->rowCount()]);
    }

    if ($method === 'DELETE') {
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
