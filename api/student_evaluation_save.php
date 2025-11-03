<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = getPdo();
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['unit_id']) || !isset($input['scores'])) {
            jsonResponse(400, ['error' => 'unit_id and scores are required']);
        }

        $unitId = (int)$input['unit_id'];
        $scores = $input['scores'];

        if ($unitId <= 0) {
            jsonResponse(400, ['error' => 'Invalid unit_id']);
        }

        // Verify unit exists
        $unitStmt = $pdo->prepare('SELECT unit_code FROM units WHERE id = ?');
        $unitStmt->execute([$unitId]);
        $unit = $unitStmt->fetch();

        if (!$unit) {
            jsonResponse(404, ['error' => 'Unit not found']);
        }

        $unitCode = $unit['unit_code'];

        // Begin transaction
        $pdo->beginTransaction();

        $updated = 0;
        foreach ($scores as $score) {
            if (!isset($score['reg_no']) || !isset($score['cat_score']) || !isset($score['assignment_score'])) {
                continue;
            }

            $regNo = trim($score['reg_no']);
            $catScore = is_numeric($score['cat_score']) ? (float)$score['cat_score'] : 0;
            $assignmentScore = is_numeric($score['assignment_score']) ? (float)$score['assignment_score'] : 0;

            // Validate ranges
            if ($catScore < 0 || $catScore > 30) {
                $pdo->rollBack();
                jsonResponse(400, ['error' => "Invalid CAT score for {$regNo}: must be 0-30"]);
            }
            if ($assignmentScore < 0 || $assignmentScore > 20) {
                $pdo->rollBack();
                jsonResponse(400, ['error' => "Invalid assignment score for {$regNo}: must be 0-20"]);
            }

            // Check if student exists in enrollments for this unit
            $checkStmt = $pdo->prepare('
                SELECT COUNT(*) as count FROM enrollments e
                INNER JOIN students s ON e.student_id = s.id
                WHERE s.reg_no = ? AND e.unit_id = ?
            ');
            $checkStmt->execute([$regNo, $unitId]);
            $exists = $checkStmt->fetch()['count'];

            if ($exists == 0) {
                continue; // Skip if student not enrolled
            }

            // Insert or update student_evaluation
            $upsertStmt = $pdo->prepare('
                INSERT INTO student_evaluation (reg_no, unit_code, cat_score, assignment_score, class, cat, assignment, exam)
                VALUES (?, ?, ?, ?, 0, 0, 0, 0)
                ON DUPLICATE KEY UPDATE
                cat_score = VALUES(cat_score),
                assignment_score = VALUES(assignment_score)
            ');
            $upsertStmt->execute([$regNo, $unitCode, $catScore, $assignmentScore]);
            $updated++;
        }

        $pdo->commit();

        jsonResponse(200, [
            'success' => true,
            'message' => "Updated scores for {$updated} students",
            'updated_count' => $updated
        ]);
    }

    jsonResponse(405, ['error' => 'Method Not Allowed']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}
?>
