<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';
ensureMethod(['GET']);

$unit_id = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : null;
$unit_code = isset($_GET['unit_code']) ? trim($_GET['unit_code']) : null;

try {
    $pdo = getPdo();
    if (!$unit_id && $unit_code) {
        $stmt = $pdo->prepare('SELECT id FROM units WHERE unit_code = ? LIMIT 1');
        $stmt->execute([$unit_code]);
        $r = $stmt->fetch();
        if (!$r) jsonResponse(404, ['success' => false, 'message' => 'Unit not found']);
        $unit_id = (int)$r['id'];
    }
    if (!$unit_id) jsonResponse(400, ['success' => false, 'message' => 'unit_id or unit_code required']);

    // expects attendance table with columns: student_id, unit_id, cat, class, exam, total
    $stmt = $pdo->prepare('
        SELECT student_id,
               AVG(COALESCE(cat,0)) AS cat,
               AVG(COALESCE(`class`,0)) AS `class`,
               AVG(COALESCE(exam,0)) AS exam,
               AVG(COALESCE(total,0)) AS total
        FROM attendance
        WHERE unit_id = ?
        GROUP BY student_id
    ');
    $stmt->execute([$unit_id]);
    $rows = $stmt->fetchAll();

    $attendance = array_map(function($r){
        return [
            'student_id' => (int)$r['student_id'],
            'cat' => (float) $r['cat'],
            'class' => (float) $r['class'],
            'exam' => (float) $r['exam'],
            'total' => (float) $r['total'],
        ];
    }, $rows);

    jsonResponse(200, ['success' => true, 'attendance' => $attendance]);
} catch (PDOException $e) {
    jsonResponse(500, ['success' => false, 'message' => 'DB error', 'details' => $e->getMessage()]);
}
?>