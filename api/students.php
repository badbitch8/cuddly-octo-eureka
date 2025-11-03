<?php
// Students endpoint - fetch from students table with columns: id, name, reg_no, year_of_study, program_code
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

// ensure connection for this request
$conn = db_connect();

// Query students table directly with the specified columns
$sql = "
    SELECT id, name, reg_no, year_of_study, program_code
    FROM students
    ORDER BY name
";

$res = $conn->query($sql);
$out = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $out[] = $row;
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Query failed']);
}
$conn->close();
?>
