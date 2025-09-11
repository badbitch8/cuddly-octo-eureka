<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

// Accepts JSON payload with optional arrays: units, students, enrollments
// {
//   units: [{ code, title }...],
//   students: [{ name, email }...],
//   enrollments: [{ student_email, unit_code }...]
// }

try {
	if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
		jsonResponse(405, ['error' => 'Method Not Allowed']);
	}
	$input = getJsonInput();
	$pdo = getPdo();
	$pdo->beginTransaction();

	$result = [ 'units' => 0, 'students' => 0, 'enrollments' => 0 ];

	if (!empty($input['units']) && is_array($input['units'])) {
		$insertUnit = $pdo->prepare('INSERT INTO units (code, title) VALUES (?, ?)');
		$selectUnit = $pdo->prepare('SELECT id FROM units WHERE code = ?');
		foreach ($input['units'] as $u) {
			$code = trim((string)($u['code'] ?? ''));
			$title = trim((string)($u['title'] ?? ''));
			if ($code === '' || $title === '') continue;
			$selectUnit->execute([$code]);
			if ($selectUnit->fetch()) continue; // exists
			$insertUnit->execute([$code, $title]);
			$result['units']++;
		}
	}

	if (!empty($input['students']) && is_array($input['students'])) {
		$insertStudent = $pdo->prepare('INSERT INTO students (name, email) VALUES (?, ?)');
		$selectStudent = $pdo->prepare('SELECT id FROM students WHERE email = ?');
		foreach ($input['students'] as $s) {
			$name = trim((string)($s['name'] ?? ''));
			$email = trim((string)($s['email'] ?? ''));
			if ($name === '' || $email === '') continue;
			$selectStudent->execute([$email]);
			if ($selectStudent->fetch()) continue; // exists
			$insertStudent->execute([$name, $email]);
			$result['students']++;
		}
	}

	if (!empty($input['enrollments']) && is_array($input['enrollments'])) {
		$selectStudent = $pdo->prepare('SELECT id FROM students WHERE email = ?');
		$selectUnit = $pdo->prepare('SELECT id FROM units WHERE code = ?');
		$insertEnroll = $pdo->prepare('INSERT INTO enrollments (student_id, unit_id) VALUES (?, ?)');
		$checkDup = $pdo->prepare('SELECT id FROM enrollments WHERE student_id = ? AND unit_id = ?');
		foreach ($input['enrollments'] as $e) {
			$studentEmail = trim((string)($e['student_email'] ?? ''));
			$unitCode = trim((string)($e['unit_code'] ?? ''));
			if ($studentEmail === '' || $unitCode === '') continue;
			$selectStudent->execute([$studentEmail]);
			$student = $selectStudent->fetch();
			$selectUnit->execute([$unitCode]);
			$unit = $selectUnit->fetch();
			if (!$student || !$unit) continue;
			$checkDup->execute([$student['id'], $unit['id']]);
			if ($checkDup->fetch()) continue;
			$insertEnroll->execute([$student['id'], $unit['id']]);
			$result['enrollments']++;
		}
	}

	$pdo->commit();
	jsonResponse(200, ['imported' => $result]);
} catch (PDOException $e) {
	if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
	jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
	if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
	jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}

?>


