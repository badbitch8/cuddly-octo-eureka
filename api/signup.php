<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

// Handle preflight OPTIONS requests (for browsers)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require __DIR__ . '/db.php';

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Invalid request']);
    exit;
}

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$password = isset($input['password']) ? $input['password'] : '';

// basic validation
if ($name === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Invalid email']);
    exit;
}

$conn = db_connect();

try {
    // check email uniqueness
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Prepare failed (select)','details'=>$conn->error]);
        $conn->close();
        exit;
    }
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        $conn->close();
        http_response_code(409);
        echo json_encode(['success'=>false,'message'=>'Email already registered']);
        exit;
    }
    $stmt->close();

    // hash password
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // role: this signup page is for lecturers
    $role = 'faculty';

    // insert user
    $ins = $conn->prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())");
    if (!$ins) {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Prepare failed (insert)','details'=>$conn->error]);
        $conn->close();
        exit;
    }
    $ins->bind_param('ssss', $name, $email, $hash, $role);
    $ok = $ins->execute();
    $insert_id = $ins->insert_id;
    $ins->close();

    if ($ok) {
        // Auto-login: start session and set user info
        session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $insert_id;
        $_SESSION['user_name'] = $name;
        $_SESSION['role'] = $role;

        http_response_code(201);
        echo json_encode(['success'=>true,'message'=>'Account created','role'=>$role,'name'=>$name]);
    } else {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Insert failed','details'=>$conn->error]);
    }

    $conn->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','details'=>$e->getMessage()]);
    if (isset($conn) && $conn) { $conn->close(); }
}
?>