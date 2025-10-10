<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
	$pdo = getPdo();
	if ($method === 'GET') {
		$id = getQueryInt('id');
		if ($id !== null) {
			$stmt = $pdo->prepare('SELECT id, code, title, faculty_id, year_of_study, schedule, created_at FROM courses WHERE id = ?');
			$stmt->execute([$id]);
			$course = $stmt->fetch();
			if (!$course) { jsonResponse(404, ['error' => 'Course not found']); }
			jsonResponse(200, $course);
		}
		$q = $_GET['q'] ?? '';
		if ($q) {
			// Search
			$stmt = $pdo->prepare('SELECT id, code, title, year_of_study FROM courses WHERE code LIKE ? OR title LIKE ? ORDER BY id DESC');
			$search = '%' . $q . '%';
			$stmt->execute([$search, $search]);
			jsonResponse(200, $stmt->fetchAll());
		} else {
			$stmt = $pdo->query('SELECT id, code, title, year_of_study, created_at FROM courses ORDER BY id DESC');
			jsonResponse(200, $stmt->fetchAll());
		}
	}

	if ($method === 'POST') {
		$input = getJsonInput();
		$code = trim($input['code'] ?? '');
		$title = trim($input['title'] ?? '');
		$faculty_id = getQueryInt('faculty_id') ?? (int)($input['faculty_id'] ?? 0);
		$year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : null;
		$schedule = $input['schedule'] ?? null;
		if ($code === '' || $title === '') { jsonResponse(400, ['error' => 'code and title are required']); }
		if ($year === null) { $year = 1; }
		$stmt = $pdo->prepare('INSERT INTO courses (code, title, faculty_id, year_of_study, schedule) VALUES (?, ?, ?, ?, ?)');
		$stmt->execute([$code, $title, $faculty_id, $year, $schedule]);
		$id = (int)$pdo->lastInsertId();
		jsonResponse(201, ['id' => $id, 'code' => $code, 'title' => $title, 'year_of_study' => $year, 'faculty_id' => $faculty_id]);
	}

	if ($method === 'PUT') {
		$input = getJsonInput();
		$id = (int)($input['id'] ?? 0);
		$code = array_key_exists('code', $input) ? trim((string)$input['code']) : null;
		$title = array_key_exists('title', $input) ? trim((string)$input['title']) : null;
		$faculty_id = array_key_exists('faculty_id', $input) ? (int)$input['faculty_id'] : null;
		$year = array_key_exists('year_of_study', $input) ? (int)$input['year_of_study'] : null;
		$schedule = array_key_exists('schedule', $input) ? $input['schedule'] : null;
		if ($id <= 0 || ($code === null && $title === null && $faculty_id === null && $year === null && $schedule === null)) {
			jsonResponse(400, ['error' => 'id and at least one field required']);
		}
		$fields = [];
		$params = [];
		if ($code !== null) { $fields[] = 'code = ?'; $params[] = $code; }
		if ($title !== null) { $fields[] = 'title = ?'; $params[] = $title; }
		if ($faculty_id !== null) { $fields[] = 'faculty_id = ?'; $params[] = $faculty_id; }
		if ($year !== null) { $fields[] = 'year_of_study = ?'; $params[] = $year; }
		if ($schedule !== null) { $fields[] = 'schedule = ?'; $params[] = $schedule; }
		$params[] = $id;
		$sql = 'UPDATE courses SET ' . implode(', ', $fields) . ' WHERE id = ?';
		$stmt = $pdo->prepare($sql);
		$stmt->execute($params);
		jsonResponse(200, ['updated' => $stmt->rowCount()]);
	}

	if ($method === 'DELETE') {
		$id = getQueryInt('id');
		if ($id === null || $id <= 0) { jsonResponse(400, ['error' => 'id query parameter required']); }
		$stmt = $pdo->prepare('DELETE FROM courses WHERE id = ?');
		$stmt->execute([$id]);
		jsonResponse(200, ['deleted' => $stmt->rowCount()]);
	}

	jsonResponse(405, ['error' => 'Method Not Allowed']);
} catch (PDOException $e) {
	jsonResponse(500, ['error' => 'Database error']);
} catch (Throwable $e) {
	jsonResponse(500, ['error' => 'Server error']);
}

?>


