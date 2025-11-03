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
if (!$input || empty($input['date']) || empty($input['attendance']) || !isset($input['attendance_type'])) {
    echo json_encode(['success'=>false,'message'=>'Invalid payload or attendance_type is required']);
    exit;
}

$date = $conn->real_escape_string($input['date']);
$unitId = isset($input['unit_id']) ? (int)$input['unit_id'] : 0;
$attendanceType = $conn->real_escape_string($input['attendance_type']);
$att = $input['attendance'];

if ($unitId <= 0) {
    echo json_encode(['success'=>false,'message'=>'unit_id is required']);
    exit;
}

// Get unit_code from units table
$unitCode = '';
try {
    $unitStmt = $conn->prepare("SELECT unit_code FROM units WHERE id = ?");
    $unitStmt->bind_param('i', $unitId);
    $unitStmt->execute();
    $unitResult = $unitStmt->get_result();
    if ($unitResult->num_rows > 0) {
        $unitRow = $unitResult->fetch_assoc();
        $unitCode = $unitRow['unit_code'];
    } else {
        throw new Exception('Unit not found');
    }
    $unitStmt->close();
} catch (Exception $e) {
    error_log("Error getting unit code: " . $e->getMessage());
    echo json_encode(['success'=>false,'message'=>'Unit not found']);
    exit;
}

try {
    // First, delete existing attendance for this date and unit to avoid duplicates
    $deleteStmt = $conn->prepare("DELETE FROM attendance WHERE att_date = ? AND unit_id = ?");
    $deleteStmt->bind_param('si', $date, $unitId);
    $deleteStmt->execute();
    $deleteStmt->close();

    // Prepare insert statement for attendance table
    $stmt = $conn->prepare("INSERT INTO attendance (student_id, att_date, status, unit_id) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception('Statement prepare failed: ' . $conn->error);
    }

    $savedCount = 0;
    foreach ($att as $row) {
        $studentId = $row['id'];
        $status = $row['status'];

        $stmt->bind_param('sssi', $studentId, $date, $status, $unitId);
        if (!$stmt->execute()) {
            error_log("Failed to save attendance for student $studentId: " . $stmt->error);
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