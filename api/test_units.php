<?php
// Simple test to check units table and data
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int)DB_PORT);
    
    if ($conn->connect_error) {
        echo json_encode([
            'success' => false, 
            'error' => 'Connection failed',
            'details' => $conn->connect_error
        ]);
        exit;
    }
    
    // Check if units table exists
    $result = $conn->query("SHOW TABLES LIKE 'units'");
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'error' => 'Units table does not exist',
            'suggestion' => 'Run schema.sql to create the table'
        ]);
        exit;
    }
    
    // Get table structure
    $columns = [];
    $result = $conn->query("DESCRIBE units");
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }
    
    // Get sample data
    $result = $conn->query("SELECT * FROM units LIMIT 5");
    $units = [];
    while ($row = $result->fetch_assoc()) {
        $units[] = $row;
    }
    
    // Get total count
    $result = $conn->query("SELECT COUNT(*) as total FROM units");
    $count = $result->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'table_exists' => true,
        'columns' => $columns,
        'total_units' => $count,
        'sample_data' => $units
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
