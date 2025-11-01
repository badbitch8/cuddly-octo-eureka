<?php
// Logout: supports both AJAX (JSON) and direct browser navigation
session_start();
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"], $params["samesite"] ?? '');
}
session_destroy();

// If client expects JSON (AJAX)
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
if (stripos($accept, 'application/json') !== false || isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'redirect' => '/atte/index.html']); // changed to index.html
    exit;
}

// Otherwise redirect browser to index page
header('Location: /atte/index.html'); // changed from index.html
exit;
?>
