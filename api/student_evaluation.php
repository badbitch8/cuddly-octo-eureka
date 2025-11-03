<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = getPdo();
    if ($method === 'GET') {
        $unitId = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : 0;

        if ($unitId <= 0) {
            jsonResponse(400, ['error' => 'unit_id is required']);
        }

        // Get unit details
        $unitStmt = $pdo->prepare('SELECT * FROM units WHERE id = ?');
        $unitStmt->execute([$unitId]);
        $unit = $unitStmt->fetch();

        if (!$unit) {
            jsonResponse(404, ['error' => 'Unit not found']);
        }

        // Get all student evaluations for this unit
        $evaluationsStmt = $pdo->prepare('
            SELECT * FROM student_evaluation WHERE unit_code = ?
        ');
        $evaluationsStmt->execute([$unit['unit_code']]);
        $evaluations = $evaluationsStmt->fetchAll();

        // Return evaluations with data from student_evaluation table
        jsonResponse(200, [
            'unit' => [
                'id' => $unit['id'],
                'code' => $unit['unit_code'],
                'title' => $unit['unit_name']
            ],
            'evaluations' => $evaluations
        ]);
    }

    jsonResponse(405, ['error' => 'Method Not Allowed']);
} catch (PDOException $e) {
    jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
    jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}
?>
