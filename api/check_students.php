<?php
require __DIR__ . '/db.php';

$result = $conn->query("SELECT * FROM students");

if ($result) {
    echo "<table border='1'><tr><th>id</th><th>name</th><th>reg_no</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['id'] . "</td>";
        echo "<td>" . $row['name'] . "</td>";
        echo "<td>" . ($row['reg_no'] ?? 'N/A') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
?>
