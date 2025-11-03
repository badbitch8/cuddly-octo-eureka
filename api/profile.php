<?php
// Returns lecturer profile information
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/_require_lecturer.php';
require __DIR__ . '/db.php';

try {
    // Get lecturer info from session
    $lecturerId = $_SESSION['user_id'];

    $sql = "SELECT name, email, department, employee_id FROM lecturers WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed']);
        exit;
    }
    $stmt->bind_param('i', $lecturerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $lecturer = $result->fetch_assoc();
    $stmt->close();

    if ($lecturer) {
        echo json_encode([
            'success' => true,
            'profile' => [
                'name' => $lecturer['name'],
                'email' => $lecturer['email'],
                'department' => $lecturer['department'],
                'employee_id' => $lecturer['employee_id']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lecturer not found']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>
