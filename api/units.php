<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = getPdo();
    if ($method === 'GET') {
        $q = $_GET['q'] ?? '';
        if ($q !== '') {
            $search = '%' . $q . '%';
            $stmt = $pdo->prepare('SELECT * FROM units WHERE unit_code LIKE ? OR unit_name LIKE ? ORDER BY unit_code LIMIT 100');
            $stmt->execute([$search, $search]);
            $units = $stmt->fetchAll();
        } else {
            $stmt = $pdo->query('SELECT * FROM units ORDER BY unit_code LIMIT 100');
            $units = $stmt->fetchAll();
        }

        // Format for frontend: ensure we have id, code, title
        $formatted = array_map(function($u) {
            return [
                'id' => $u['id'] ?? $u['unit_id'] ?? 0,
                'code' => $u['unit_code'] ?? $u['code'] ?? '',
                'title' => $u['title'] ?? $u['name'] ?? $u['unit_name'] ?? '',
                'year_of_study' => $u['year_of_study'] ?? null,
                'program_code' => $u['program_code'] ?? null
            ];
        }, $units);

        jsonResponse(200, $formatted);
    }

    // Only GET needed for dropdowns
    jsonResponse(405, ['error' => 'Method Not Allowed']);
} catch (PDOException $e) {
    jsonResponse(500, ['error' => 'Database error', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
    jsonResponse(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}

?>
