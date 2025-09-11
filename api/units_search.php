<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

try {
	if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
		jsonResponse(405, ['error' => 'Method Not Allowed']);
	}
	$q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
	$pdo = getPdo();
	if ($q === '') {
		$stmt = $pdo->query('SELECT unit_id AS id, unit_code AS code, unit_name AS title FROM units ORDER BY unit_code ASC');
		jsonResponse(200, $stmt->fetchAll());
	}
	$like = '%' . $q . '%';
	$stmt = $pdo->prepare('SELECT unit_id AS id, unit_code AS code, unit_name AS title FROM units WHERE unit_code LIKE ? OR unit_name LIKE ? ORDER BY unit_code ASC LIMIT 20');
	$stmt->execute([$like, $like]);
	jsonResponse(200, $stmt->fetchAll());
} catch (PDOException $e) {
	jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
	jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}

?>


