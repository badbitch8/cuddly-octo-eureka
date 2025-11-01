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

        // Get all students for this unit
        $studentsStmt = $pdo->prepare('
            SELECT DISTINCT s.id, s.name, s.reg_no, s.year_of_study, s.program_code
            FROM students s
            INNER JOIN enrollments e ON s.id = e.student_id
            WHERE e.unit_id = ?
            ORDER BY s.name
        ');
        $studentsStmt->execute([$unitId]);
        $students = $studentsStmt->fetchAll();

        $evaluations = [];

        foreach ($students as $student) {
            // Get attendance percentage
            $attendanceStmt = $pdo->prepare('
                SELECT
                    COUNT(*) as total_classes,
                    SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present_count
                FROM attendance
                WHERE student_id = ? AND unit_id = ?
            ');
            $attendanceStmt->execute([$student['reg_no'], $unitId]);
            $attendance = $attendanceStmt->fetch();

            $attendance_percentage = 0;
            if ($attendance['total_classes'] > 0) {
                $attendance_percentage = round(($attendance['present_count'] / $attendance['total_classes']) * 100, 1);
            }

            // Get CAT scores (assuming cat column stores the score)
            $catStmt = $pdo->prepare('
                SELECT AVG(cat) as avg_cat
                FROM attendance
                WHERE student_id = ? AND unit_id = ? AND cat > 0
            ');
            $catStmt->execute([$student['reg_no'], $unitId]);
            $cat = $catStmt->fetch();

            $cat_score = $cat['avg_cat'] ? round($cat['avg_cat'], 1) : 0;

            // Get assignment scores (assuming we need to add this functionality)
            // For now, we'll use a placeholder
            $assignment_score = 0; // This would need to be implemented

            // Calculate exam eligibility (50% attendance required)
            $eligible_for_exam = $attendance_percentage >= 50;

            $evaluations[] = [
                'student_id' => $student['id'],
                'reg_no' => $student['reg_no'],
                'name' => $student['name'],
                'year_of_study' => $student['year_of_study'],
                'program' => $student['program_code'],
                'attendance_percentage' => $attendance_percentage,
                'cat_score' => $cat_score,
                'assignment_score' => $assignment_score,
                'eligible_for_exam' => $eligible_for_exam
            ];
        }

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
