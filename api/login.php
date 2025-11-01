<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php'; // must provide db_connect()

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing credentials']);
    exit;
}

$email = strtolower(trim($input['email']));
$password = $input['password'];

$conn = db_connect();

$stmt = $conn->prepare("SELECT id, name, password_hash, role FROM users WHERE email = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB prepare failed']);
    $conn->close();
    exit;
}
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $stmt->close();
    $conn->close();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

$stmt->bind_result($id, $name, $password_hash, $role);
$stmt->fetch();
$stmt->close();

if (!password_verify($password, $password_hash)) {
    $conn->close();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

// success — start session and return role
session_start();
session_regenerate_id(true);
$_SESSION['user_id'] = $id;
$_SESSION['user_name'] = $name;
$_SESSION['role'] = $role;

// return minimal JSON for client routing
echo json_encode(['success' => true, 'role' => $role, 'name' => $name]);

$conn->close();
?>