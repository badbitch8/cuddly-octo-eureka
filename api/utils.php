<?php

function jsonResponse(int $status, $data): void {
	header('Content-Type: application/json');
	http_response_code($status);
	echo json_encode($data);
	exit;
}

function getJsonInput(): array {
	$raw = file_get_contents('php://input');
	if ($raw === false || $raw === '') {
		return [];
	}
	$decoded = json_decode($raw, true);
	return is_array($decoded) ? $decoded : [];
}

function ensureMethod(array $allowed): void {
	$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
	if (!in_array($method, $allowed, true)) {
		jsonResponse(405, ['error' => 'Method Not Allowed', 'allowed' => $allowed]);
	}
}

function getQueryInt(string $key, ?int $default = null): ?int {
	if (!isset($_GET[$key])) {
		return $default;
	}
	$value = filter_var($_GET[$key], FILTER_VALIDATE_INT);
	return $value === false ? $default : $value;
}

?>


