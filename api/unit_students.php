<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';
ensureMethod(['GET']);

// optional: require session
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
if (empty($_SESSION['lecturer'])) {
    // still allow read; remove this block if auth required
    // jsonResponse(401, ['success' => false, 'message' => 'Authentication required']);
}

$unitIdParam = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : 0;
$code = trim($_GET['unit_code'] ?? '');
if ($unitIdParam <= 0 && $code === '') jsonResponse(400, ['success' => false, 'message' => 'unit_id or unit_code required']);

try {
    $pdo = getPdo();
    
    // Check which column name the units table uses
    $idColumn = 'id';
    try {
        $checkCol = $pdo->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME IN ('id', 'unit_id')")->fetchColumn();
        if ($checkCol) {
            $idColumn = $checkCol;
        }
    } catch (\Exception $e) {
        // Default to 'id'
    }
    
    // find unit (prefer unit_id when provided) - flexible for any column naming
    $unit = null;
    if ($unitIdParam > 0) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM units WHERE $idColumn = ? LIMIT 1");
            $stmt->execute([$unitIdParam]);
            $unit = $stmt->fetch();
        } catch (\Exception $e) {
            error_log("Error finding unit by id: " . $e->getMessage());
        }
    }
    
    if (!$unit && $code !== '') {
        try {
            // Try to find by unit_code
            $stmt = $pdo->prepare('SELECT * FROM units WHERE unit_code = ? LIMIT 1');
            $stmt->execute([$code]);
            $unit = $stmt->fetch();
        } catch (\Exception $e) {
            error_log("Error finding unit by code: " . $e->getMessage());
        }
    }
    
    if (!$unit) {
        // Get available units for debugging
        $availableUnits = $pdo->query("SELECT $idColumn as id, unit_code FROM units LIMIT 5")->fetchAll();
        jsonResponse(404, ['success' => false, 'message' => 'Unit not found', 'details' => ['unit_id' => $unitIdParam, 'unit_code' => $code, 'available_units' => $availableUnits]]);
    }
    
    // Normalize unit data
    $unitId = $unit[$idColumn] ?? $unit['id'] ?? $unit['unit_id'] ?? 0;

    // Get unit's program_code and year_of_study for matching
    $unitProgramCode = $unit['program_code'] ?? null;
    $unitYearOfStudy = $unit['year_of_study'] ?? null;
    
    // Check if students table has the necessary columns
    $hasRegNo = false;
    $hasRegistration = false;
    $hasProgramCode = false;
    try {
        $cols = $pdo->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'")->fetchAll(PDO::FETCH_COLUMN);
        $hasRegNo = in_array('reg_no', $cols);
        $hasRegistration = in_array('registration', $cols);
        $hasProgramCode = in_array('program_code', $cols);
    } catch (\Exception $e) {
        // Assume columns exist
        $hasRegNo = true;
        $hasRegistration = true;
        $hasProgramCode = true;
    }
    
    // Build flexible SQL based on available columns
    $regNoField = 'NULL';
    if ($hasRegNo && $hasRegistration) {
        $regNoField = 'COALESCE(reg_no, registration, "")';
    } elseif ($hasRegNo) {
        $regNoField = 'COALESCE(reg_no, "")';
    } elseif ($hasRegistration) {
        $regNoField = 'COALESCE(registration, "")';
    }
    
    $programField = $hasProgramCode ? 'COALESCE(program_code, "")' : '""';
    
    // Load students - simplified approach
    $students = [];
    
    // Strategy 1: Try program_code match if available
    if ($unitProgramCode && $hasProgramCode) {
        try {
            $sql = "SELECT id, name, $regNoField AS reg_no, 
                    year_of_study, $programField AS program 
                    FROM students 
                    WHERE program_code = ? 
                    ORDER BY name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$unitProgramCode]);
            $students = $stmt->fetchAll();
        } catch (\Throwable $e) {
            error_log("Error loading students by program_code: " . $e->getMessage());
            $students = [];
        }
    }
    
    // Strategy 2: Try year_of_study match if no program match
    if (empty($students) && $unitYearOfStudy) {
        try {
            $sql = "SELECT id, name, $regNoField AS reg_no, 
                    year_of_study, $programField AS program 
                    FROM students 
                    WHERE year_of_study = ? 
                    ORDER BY name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$unitYearOfStudy]);
            $students = $stmt->fetchAll();
        } catch (\Throwable $e) {
            error_log("Error loading students by year: " . $e->getMessage());
            $students = [];
        }
    }

    // Final fallback: return ALL students (for testing/debugging)
    if (empty($students)) {
        try {
            $sql = "SELECT id, name, $regNoField AS reg_no, 
                    year_of_study, $programField AS program 
                    FROM students 
                    ORDER BY name 
                    LIMIT 100";
            $students = $pdo->query($sql)->fetchAll();
        } catch (\Throwable $e) {
            error_log("Error loading all students: " . $e->getMessage());
            $students = [];
        }
    }
    
    // Get total count for debugging
    $totalStudents = 0;
    try {
        $totalStudents = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
    } catch (\Exception $e) {}

    jsonResponse(200, [
        'success' => true, 
        'unit' => $unit, 
        'students' => $students,
        'debug' => [
            'total_students_in_db' => $totalStudents,
            'unit_program_code' => $unitProgramCode,
            'unit_year_of_study' => $unitYearOfStudy,
            'matched_students' => count($students)
        ]
    ]);
} catch (PDOException $e) {
    error_log("PDO Exception: " . $e->getMessage());
    jsonResponse(500, ['success' => false, 'message' => 'Database error', 'details' => $e->getMessage()]);
} catch (\Throwable $e) {
    error_log("General Exception: " . $e->getMessage());
    jsonResponse(500, ['success' => false, 'message' => 'Server error', 'details' => $e->getMessage()]);
}
