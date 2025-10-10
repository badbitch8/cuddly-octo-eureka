<?php
require_once __DIR__ . '/config.php';

try {
    // Connect without database
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");

    // Select database
    $pdo->exec("USE `" . DB_NAME . "`");

    // Drop tables if exist
    $pdo->exec("DROP TABLE IF EXISTS attendance");
    $pdo->exec("DROP TABLE IF EXISTS enrollments");
    $pdo->exec("DROP TABLE IF EXISTS courses");
    $pdo->exec("DROP TABLE IF EXISTS students");
    $pdo->exec("DROP TABLE IF EXISTS users");

    // Read schema, skip first two lines (CREATE DATABASE and USE)
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $lines = explode("\n", $schema);
    $lines = array_slice($lines, 2); // Skip first two lines
    $schema = implode("\n", $lines);

    // Execute schema
    $pdo->exec($schema);

    echo "Database and tables created successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
