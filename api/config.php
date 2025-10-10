<?php
// Basic configuration for database and CORS

// Database credentials (XAMPP defaults)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'atte');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// CORS configuration
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ALLOWED_ORIGINS') ?: '*');
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization');

function sendCorsHeaders(): void {
	header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
	header('Access-Control-Allow-Methods: ' . CORS_ALLOWED_METHODS);
	header('Access-Control-Allow-Headers: ' . CORS_ALLOWED_HEADERS);
	header('Access-Control-Max-Age: 86400');
}

// Handle preflight
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	sendCorsHeaders();
	http_response_code(204);
	exit;
}

if (isset($_SERVER['REQUEST_METHOD'])) {
	sendCorsHeaders();
}
?>


