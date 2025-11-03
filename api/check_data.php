<?php
require __DIR__ . '/db.php';

$result = $conn->query("SELECT * FROM student_evaluation");

if ($result) {
    echo "<table border='1'><tr><th>reg_no</th><th>unit_code</th><th>class</th><th>assignment</th><th>cat</th><th>exam</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['reg_no'] . "</td>";
        echo "<td>" . $row['unit_code'] . "</td>";
        echo "<td>" . $row['class'] . "</td>";
        echo "<td>" . $row['assignment'] . "</td>";
        echo "<td>" . $row['cat'] . "</td>";
        echo "<td>" . $row['exam'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
?>
