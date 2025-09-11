<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

// Returns students for a given unit by joining on year_of_study
// Accepts: GET /api/unit_students.php?unit_code=CSC101 or ?unit_name=Intro%20to%20CS or ?unit_id=1

try {
	if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
		jsonResponse(405, ['error' => 'Method Not Allowed']);
	}
	$pdo = getPdo();
	$unitId = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : null;
	$unitCode = isset($_GET['unit_code']) ? trim((string)$_GET['unit_code']) : null;
	$unitName = isset($_GET['unit_name']) ? trim((string)$_GET['unit_name']) : null;

	if ($unitId === null && $unitCode === null && $unitName === null) {
		jsonResponse(400, ['error' => 'Provide unit_id or unit_code or unit_name']);
	}

	// Resolve unit and its year_of_study
	if ($unitId !== null) {
		$stmt = $pdo->prepare('SELECT unit_id, unit_code, unit_name, year_of_study FROM units WHERE unit_id = ?');
		$stmt->execute([$unitId]);
	} elseif ($unitCode !== null && $unitCode !== '') {
		$stmt = $pdo->prepare('SELECT unit_id, unit_code, unit_name, year_of_study FROM units WHERE unit_code = ?');
		$stmt->execute([$unitCode]);
	} else {
		$stmt = $pdo->prepare('SELECT unit_id, unit_code, unit_name, year_of_study FROM units WHERE unit_name = ?');
		$stmt->execute([$unitName]);
	}
	$unit = $stmt->fetch();
	if (!$unit) { jsonResponse(404, ['error' => 'Unit not found']); }

	// Join students by year_of_study
	$studentsStmt = $pdo->prepare('SELECT id, name, reg_no, year_of_study FROM students WHERE year_of_study = ? ORDER BY name ASC');
	$studentsStmt->execute([$unit['year_of_study']]);
	$students = $studentsStmt->fetchAll();

	jsonResponse(200, [
		'unit' => [
			'id' => (int)$unit['unit_id'],
			'code' => $unit['unit_code'],
			'title' => $unit['unit_name'],
			'year_of_study' => (int)$unit['year_of_study']
		],
		'students' => $students
	]);
} catch (PDOException $e) {
	jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
	jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}

?>


