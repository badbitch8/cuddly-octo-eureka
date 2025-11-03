<?php
require __DIR__ . '/db.php';

try {
    // Drop the existing primary key if it exists
    $conn->query("ALTER TABLE student_evaluation DROP PRIMARY KEY");

    // Add the new composite primary key
    $conn->query("ALTER TABLE student_evaluation ADD PRIMARY KEY (reg_no, unit_code)");

    echo "Table altered successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}

$conn->close();
?>
