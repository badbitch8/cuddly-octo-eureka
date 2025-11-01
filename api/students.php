<?php
// Simple students endpoint — update DB creds and table name as needed
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

// ensure connection for this request
$conn = db_connect();

// Align with schema: students(id, user_id, reg_no, ...), users(id, name,...)
$sql = "
    SELECT s.id, u.name, s.reg_no
    FROM students s
    JOIN users u ON u.id = s.user_id
    ORDER BY u.name
";

$res = $conn->query($sql);
$out = [];
if ($res) {
    while ($row = $res->fetch_assoc()) { $out[] = $row; }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Query failed']);
}
$conn->close();
?>
