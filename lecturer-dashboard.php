<?php
session_start();
// redirect to login if not authenticated as lecturer
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'lecturer') {
    header('Location: /atte/index.html'); // changed from index.html to index.html
    exit;
}
// serve the static dashboard HTML located in the client folder
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/client/lecturer-dashboard.html');
?>
