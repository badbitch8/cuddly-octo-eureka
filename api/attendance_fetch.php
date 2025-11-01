<?php
// Returns JSON: { success: true, attendance: { student_id: "present", ... } }
// or { success: true, attendance: [ { student_id: "...", status: "present" }, ... ] }
// Adjust DB creds and table names to match your schema.

header('Content-Type: application/json; charset=utf-8');
// require authentication
require __DIR__ . '/_require_lecturer.php';
require __DIR__ . '/db.php';

$date = isset($_GET['date']) ? $_GET['date'] : '';
$unitId = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : 0;

if (!$date) {
    echo json_encode(['success'=>false,'message'=>'Missing date']);
    exit;
}

// Ensure date is sanitized (YYYY-MM-DD)
$date = $conn->real_escape_string($date);

// Query attendance table for the date and unit
// If unit_id is provided, filter by it; otherwise get all for the date
if ($unitId > 0) {
    $sql = "SELECT student_id, status FROM attendance WHERE att_date = ? AND unit_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success'=>false,'message'=>'Prepare failed']);
        exit;
    }
    $stmt->bind_param('si', $date, $unitId);
} else {
    $sql = "SELECT student_id, status FROM attendance WHERE att_date = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success'=>false,'message'=>'Prepare failed']);
        exit;
    }
    $stmt->bind_param('s', $date);
}
$stmt->execute();
$result = $stmt->get_result();

$out = [];
while ($row = $result->fetch_assoc()) {
    $out[$row['student_id']] = $row['status'];
}

$stmt->close();
$conn->close();

echo json_encode(['success'=>true,'attendance'=>$out]);
?>