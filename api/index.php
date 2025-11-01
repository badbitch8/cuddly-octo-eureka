<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
echo json_encode([
	'status' => 'ok',
	'message' => 'MUT Attendance API',
	'endpoints' => [
		'/students.php',
		'/units.php',
		'/units_search.php?q=BIT',
		'/unit_students.php?unit_code=BIT%20101'
	]
]);
?>


