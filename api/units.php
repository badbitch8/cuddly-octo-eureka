<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
	$pdo = getPdo();
	if ($method === 'GET') {
		$id = getQueryInt('id');
		if ($id !== null) {
			$stmt = $pdo->prepare('SELECT unit_id AS id, unit_code AS code, unit_name AS title, year_of_study, NOW() AS created_at FROM units WHERE unit_id = ?');
			$stmt->execute([$id]);
			$unit = $stmt->fetch();
			if (!$unit) { jsonResponse(404, ['error' => 'Unit not found']); }
			jsonResponse(200, $unit);
		}
		$stmt = $pdo->query('SELECT unit_id AS id, unit_code AS code, unit_name AS title, year_of_study, NOW() AS created_at FROM units ORDER BY unit_id DESC');
		jsonResponse(200, $stmt->fetchAll());
	}

	if ($method === 'POST') {
		$input = getJsonInput();
		$code = trim($input['code'] ?? '');
		$title = trim($input['title'] ?? '');
		$year = isset($input['year_of_study']) ? (int)$input['year_of_study'] : null;
		if ($code === '' || $title === '') { jsonResponse(400, ['error' => 'code and title are required']); }
		if ($year === null) { $year = 1; }
		$stmt = $pdo->prepare('INSERT INTO units (unit_code, unit_name, year_of_study) VALUES (?, ?, ?)');
		$stmt->execute([$code, $title, $year]);
		$id = (int)$pdo->lastInsertId();
		jsonResponse(201, ['id' => $id, 'code' => $code, 'title' => $title, 'year_of_study' => $year]);
	}

	if ($method === 'PUT') {
		$input = getJsonInput();
		$id = (int)($input['id'] ?? 0);
		$code = array_key_exists('code', $input) ? trim((string)$input['code']) : null;
		$title = array_key_exists('title', $input) ? trim((string)$input['title']) : null;
		$year = array_key_exists('year_of_study', $input) ? (int)$input['year_of_study'] : null;
		if ($id <= 0 || ($code === null && $title === null && $year === null)) {
			jsonResponse(400, ['error' => 'id and at least one of code/title/year_of_study required']);
		}
		$fields = [];
		$params = [];
		if ($code !== null) { $fields[] = 'unit_code = ?'; $params[] = $code; }
		if ($title !== null) { $fields[] = 'unit_name = ?'; $params[] = $title; }
		if ($year !== null) { $fields[] = 'year_of_study = ?'; $params[] = $year; }
		$params[] = $id;
		$sql = 'UPDATE units SET ' . implode(', ', $fields) . ' WHERE unit_id = ?';
		$stmt = $pdo->prepare($sql);
		$stmt->execute($params);
		jsonResponse(200, ['updated' => $stmt->rowCount()]);
	}

	if ($method === 'DELETE') {
		$id = getQueryInt('id');
		if ($id === null || $id <= 0) { jsonResponse(400, ['error' => 'id query parameter required']); }
		$stmt = $pdo->prepare('DELETE FROM units WHERE unit_id = ?');
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


