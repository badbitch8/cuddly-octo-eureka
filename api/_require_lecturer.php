<?php
// Guard: require a logged-in lecturer session. Include at top of protected endpoints.
session_start();
if (!isset($_SESSION['user_id']) || !in_array(($_SESSION['role'] ?? ''), ['lecturer','faculty'], true)) {
    // Redirect unauthenticated requests to the site index page
    header('Location: /atte/index.html'); // changed from index.html to index.html
    exit;
}
?>
