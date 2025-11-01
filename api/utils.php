<?php
header('Content-Type: application/json; charset=utf-8');

function jsonResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    $obj = json_decode($raw, true);
    return is_array($obj) ? $obj : $_POST;
}

function ensureMethod($allowed = ['GET']) {
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowed)) {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }
}

?>


