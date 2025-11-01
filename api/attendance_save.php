<?php
// Accepts JSON: { date: "YYYY-MM-DD", attendance: [{id:"S001", status:"present"}, ...] }
// Saves to `attendance` table with columns (student_id, att_date, status, created_at)
// Adjust DB creds and table names to match your setup.

header('Content-Type: application/json; charset=utf-8');
// Enable error reporting for debugging
ini_set('display_errors', 0); // Don't display in output, but log
error_reporting(E_ALL);

// Optional authentication (commented out for testing)
// require __DIR__ . '/_require_lecturer.php';
require __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['date']) || empty($input['attendance'])) {
    echo json_encode(['success'=>false,'message'=>'Invalid payload']);
    exit;
}

$date = $conn->real_escape_string($input['date']);
$unitId = isset($input['unit_id']) ? (int)$input['unit_id'] : 0;
$att = $input['attendance'];

if ($unitId <= 0) {
    echo json_encode(['success'=>false,'message'=>'unit_id is required']);
    exit;
}

// prepare statements: try update else insert (here we use REPLACE INTO for simplicity if your table has UNIQUE(student_id, unit_id, att_date))
try {
    $stmt = $conn->prepare("REPLACE INTO attendance (student_id, unit_id, att_date, status, created_at) VALUES (?, ?, ?, ?, NOW())");
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $savedCount = 0;
    foreach ($att as $row) {
        $id = $row['id'];
        $status = $row['status'] === 'present' ? 'present' : 'absent';
        $stmt->bind_param('siss', $id, $unitId, $date, $status);
        if (!$stmt->execute()) {
            error_log("Failed to save attendance for student $id: " . $stmt->error);
        } else {
            $savedCount++;
        }
    }
    $stmt->close();
    $conn->close();

    echo json_encode(['success'=>true, 'message'=>"Saved $savedCount attendance records"]);
} catch (Exception $e) {
    error_log("Attendance save error: " . $e->getMessage());
    echo json_encode(['success'=>false,'message'=>'Save error: ' . $e->getMessage()]);
}
?>