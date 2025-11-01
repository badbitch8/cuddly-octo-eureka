(function () {
	const API_BASE = (function resolveApiBase() {
    const stored = storageGetEnv('API_BASE', '');
    if (stored) return stored;
    // Serve API from XAMPP installation path
    return window.location.origin + '/atte/api';
})();

	const views = {
		auth: document.getElementById('auth-view'),
		lecturerDashboard: document.getElementById('lecturer-dashboard'),
		unitSetup: document.getElementById('unit-setup'),
		attendanceRoster: document.getElementById('attendance-roster'),
		studentProgress: document.getElementById('student-progress'),
		studentDashboard: document.getElementById('student-dashboard'),
		adminPanel: document.getElementById('admin-panel'),
		dashboard: document.getElementById('dashboard-view') // legacy
	};

	const links = {
		toSignup: document.getElementById('link-to-signup'),
		toLogin: document.getElementById('link-to-login'),
		forgot: document.getElementById('link-forgot')
	};

	const forms = {
		login: document.getElementById('login-form'),
		signup: document.getElementById('signup-form'),
		unit: document.getElementById('unit-form')
	};

	const els = {
		lecturerName: document.getElementById('lecturer-name'),
		unitTitle: document.getElementById('unit-title'),
		date: document.getElementById('today-date'),
		studentsList: document.getElementById('students-list'),
		unitNameList: document.getElementById('unit-name-list'),
		unitCodeList: document.getElementById('unit-code-list'),
		downloadBtn: document.getElementById('download-btn'),
		resetBtn: document.getElementById('reset-btn'),
		manageUnitBtn: document.getElementById('manage-unit-btn'),
		logout1: document.getElementById('logout-btn'),
		logout2: document.getElementById('logout-btn-2')
	};

	// Storage helpers
	const storage = {
		get(key, fallback) {
			try {
				const v = localStorage.getItem(key);
				return v ? JSON.parse(v) : fallback;
			} catch (_) { return fallback; }
		},
		set(key, value) {
			localStorage.setItem(key, JSON.stringify(value));
		},
		remove(key) { localStorage.removeItem(key); }
	};

	// Models
	function getAuth() { return storage.get('auth', { loggedIn: false, user: null, role: '', token: '' }); }
	function setAuth(v) { storage.set('auth', v); }

	function getUnit() { return storage.get('unit', null); }
	function saveUnit(unit) { storage.set('unit', unit); }

	function getStudents() { return storage.get('students', []); }
	function saveStudents(list) { storage.set('students', list); }

	function getAttendanceDate() { return storage.get('attendanceDate', null); }
	function setAttendanceDate(d) { storage.set('attendanceDate', d); }

	function todayKey() {
		const d = new Date();
		return d.toISOString().slice(0, 10); // YYYY-MM-DD
	}

	// API helpers
	async function apiGet(path) {
		const res = await fetch(`${API_BASE}${path}`, { headers: { 'Accept': 'application/json' } });
		if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
		return res.json();
	}

	async function apiJson(path, method, body) {
		const auth = getAuth();
		const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
		if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
		const res = await fetch(`${API_BASE}${path}`, {
			method,
			headers,
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
		return res.json();
	}

	function storageGetEnv(key, fallback) {
		try {
			const v = localStorage.getItem(key);
			return v ? v : fallback;
		} catch (_) { return fallback; }
	}

	function ensureTodaySession() {
		const today = todayKey();
		if (getAttendanceDate() !== today) {
			// reset statuses for a new day
			const list = getStudents().map(s => ({ ...s, status: 'unmarked' }));
			saveStudents(list);
			setAttendanceDate(today);
		}
	}

	function show(view) {
		Object.values(views).forEach(v => v.classList.add('hidden'));
		views[view].classList.remove('hidden');
		updateHeader(view);

		// Setup specific views
		if (view === 'unit') {
			setupUnitSelection();
		} else if (view === 'campus') {
			init3DScene();
		} else if (view === 'facultyDashboard') {
			loadFacultyDashboard();
		} else if (view === 'studentDashboard') {
			loadStudentDashboard();
		} else if (view === 'adminPanel') {
			loadAdminPanel();
		}
	}

	function updateHeader(view) {
		const backBtn = document.getElementById('back-btn');
		const headerTitle = document.getElementById('header-title');
		const headerUnitTitle = document.getElementById('header-unit-title');
		const headerDate = document.getElementById('header-date');
		const headerActions = document.getElementById('header-actions');
		const logoutBtn = document.getElementById('logout-btn');

		// Hide all header elements first
		if (backBtn) backBtn.classList.add('hidden');
		if (headerTitle) headerTitle.classList.add('hidden');
		if (headerUnitTitle) headerUnitTitle.classList.add('hidden');
		if (headerDate) headerDate.classList.add('hidden');
		if (headerActions) headerActions.classList.add('hidden');
		if (logoutBtn) logoutBtn.classList.add('hidden');

		const auth = getAuth();
		if (auth.loggedIn) {
			if (headerTitle) headerTitle.classList.remove('hidden');
			if (logoutBtn) logoutBtn.classList.remove('hidden');
			if (backBtn) backBtn.classList.remove('hidden');
		}
		if (view === 'unit' || view === 'facultyDashboard') {
			if (headerUnitTitle) headerUnitTitle.classList.remove('hidden');
			if (headerDate) headerDate.classList.remove('hidden');
			if (headerActions) headerActions.classList.remove('hidden');
		}
	}

	function setTab(tab) {
		if (tab === 'login') {
			forms.login.classList.remove('hidden');
			forms.signup.classList.add('hidden');
		} else {
			forms.signup.classList.remove('hidden');
			forms.login.classList.add('hidden');
		}
	}

	function renderStudents() {
		const students = getStudents();
		els.studentsList.innerHTML = '';
		students.forEach((s, index) => {
			const row = document.createElement('div');
			row.className = 'list-item';
			row.innerHTML = `
				<div>${escapeHtml(s.name || '')}</div>
				<div>${escapeHtml(s.registrationNumber || '')}</div>
				<div class="status-group">
					<button class="status-present ${s.status === 'present' ? 'active' : ''}" data-index="${index}" data-status="present">Present</button>
					<button class="status-absent ${s.status === 'absent' ? 'active' : ''}" data-index="${index}" data-status="absent">Absent</button>
				</div>
			`;
			els.studentsList.appendChild(row);
		});
	}

	function escapeHtml(str) {
		return String(str)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');
	}

	function updateStatus(index, status) {
		const students = getStudents();
		if (!students[index]) {
			console.warn('Student not found at index:', index);
			return;
		}
		students[index].status = status;
		saveStudents(students);
		renderStudents();
	}

	function downloadTodayCsv() {
		const unit = getUnit();
		const students = getStudents();
		const today = todayKey();
		
		const presentStudents = students.filter(s => s.status === 'present');
		if (presentStudents.length === 0) {
			alert('No students have been marked as present yet. Please mark some students as present before downloading.');
			return;
		}
		
		const headers = ['date','unitCode','unitName','registrationNumber','name','status'];
		const lines = [headers.join(',')];
		presentStudents.forEach(s => {
			const row = [today, unit?.code || '', unit?.name || '', s.registrationNumber || '', s.name || '', s.status || 'present'];
			lines.push(row.map(csvEscape).join(','));
		});
		const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${today}_${unit?.code || 'UNIT'}_attendance_present_only.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	function csvEscape(value) {
		const v = String(value ?? '');
		if (/[",\n]/.test(v)) {
			return '"' + v.replaceAll('"', '""') + '"';
		}
		return v;
	}

	function parseStudentsCsv(text) {
		const lines = text.split(/\r?\n/).filter(Boolean);
		if (lines.length === 0) return [];
		const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
		const regIdx = headers.indexOf('registrationnumber');
		const nameIdx = headers.indexOf('name');
		if (regIdx === -1 || nameIdx === -1) return [];
		const out = [];
		for (let i = 1; i < lines.length; i++) {
			const cols = safeSplitCsvLine(lines[i]);
			const registrationNumber = (cols[regIdx] || '').trim();
			const name = (cols[nameIdx] || '').trim();
			if (!registrationNumber && !name) continue;
			out.push({ registrationNumber, name, status: 'unmarked' });
		}
		return out;
	}

	let unitsData = []; // Store units data for cross-referencing

	async function populateUnitSuggestions() {
		try {
			const units = await apiGet('/units_search.php');
			unitsData = units; // Store for cross-referencing
			if (els.unitNameList) els.unitNameList.innerHTML = units.map(u => `<option value="${escapeHtml(u.title)}"></option>`).join('');
			if (els.unitCodeList) els.unitCodeList.innerHTML = units.map(u => `<option value="${escapeHtml(u.code)}"></option>`).join('');
		} catch (_) { /* ignore */ }
	}

	function setupUnitSelection() {
		const unitNameInput = document.getElementById('unit-name');
		const unitCodeInput = document.getElementById('unit-code');

		if (unitNameInput && unitCodeInput) {
			// When unit name is selected, auto-fill unit code
			unitNameInput.addEventListener('input', () => {
				const selectedName = unitNameInput.value.trim();
				if (selectedName && unitsData.length > 0) {
					const matchingUnit = unitsData.find(u => u.title === selectedName);
					if (matchingUnit) {
						unitCodeInput.value = matchingUnit.code;
					}
				}
			});

			// When unit code is selected, auto-fill unit name
			unitCodeInput.addEventListener('input', () => {
				const selectedCode = unitCodeInput.value.trim();
				if (selectedCode && unitsData.length > 0) {
					const matchingUnit = unitsData.find(u => u.code === selectedCode);
					if (matchingUnit) {
						unitNameInput.value = matchingUnit.title;
					}
				}
			});
		}
	}

	function safeSplitCsvLine(line) {
		const result = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
				else { inQuotes = !inQuotes; }
			} else if (ch === ',' && !inQuotes) {
				result.push(current); current = '';
			} else { current += ch; }
		}
		result.push(current);
		return result;
	}

	// Event wiring
	if (links.toSignup) links.toSignup.addEventListener('click', (e) => { e.preventDefault(); setTab('signup'); });
	if (links.toLogin) links.toLogin.addEventListener('click', (e) => { e.preventDefault(); setTab('login'); });
	if (links.forgot) links.forgot.addEventListener('click', (e) => { e.preventDefault(); alert('Password reset is not set up in this demo.'); });

	if (forms.signup) forms.signup.addEventListener('submit', async (e) => {
		e.preventDefault();
		const name = document.getElementById('signup-name').value.trim();
		const email = document.getElementById('signup-email').value.trim().toLowerCase();
		const password = document.getElementById('signup-password').value;

		if (!name || !email || !password) {
			alert('Please fill in all fields');
			return;
		}

		try {
			const resp = await apiJson('/signup.php', 'POST', { name, email, password });
			// Auto-login and route to dashboard
			setAuth({ loggedIn: true, user: { name: resp.name || name, email }, role: resp.role || 'faculty', token: '' });
			const ln = document.getElementById('lecturer-name');
			if (ln) ln.textContent = resp.name || name;
			loadLecturerDashboard();
			show('lecturerDashboard');
		} catch (err) {
			alert('Signup failed: ' + err.message);
		}
	});

	if (forms.login) forms.login.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = document.getElementById('login-email').value.trim().toLowerCase();
		const password = document.getElementById('login-password').value;

		if (!email || !password) {
			alert('Please fill in all fields');
			return;
		}

		try {
			const resp = await apiJson('/login.php', 'POST', { email, password });
			setAuth({ loggedIn: true, user: { name: resp.name || '', email }, role: resp.role || 'faculty', token: '' });
			if (els.lecturerName) els.lecturerName.textContent = resp.name || '';
			
			// Always go to lecturer dashboard
			loadLecturerDashboard();
			show('lecturerDashboard');
		} catch (err) {
			alert('Login failed: ' + err.message);
		}
	});

	if (forms.unit) forms.unit.addEventListener('submit', async (e) => {
		e.preventDefault();
		const name = document.getElementById('unit-name').value.trim();
		const code = document.getElementById('unit-code').value.trim();
		try {
			const byCode = code ? await apiGet(`/unit_students.php?unit_code=${encodeURIComponent(code)}`).catch(() => null) : null;
			const byName = byCode || (name ? await apiGet(`/unit_students.php?unit_name=${encodeURIComponent(name)}`).catch(() => null) : null);
			if (!byName) throw new Error('Unit not found');
			saveUnit({ name: byName.unit.title, code: byName.unit.code, id: byName.unit.id, year: byName.unit.year_of_study });
		} catch (err) {
			console.warn('Unit resolution failed, saving locally instead:', err);
			saveUnit({ name, code });
		}
		
		// Load students from the selected unit
		try {
			const unit = getUnit();
			const resp = await apiGet(`/unit_students.php?unit_code=${encodeURIComponent(unit.code)}`);
			const mapped = resp.students.map(s => ({ registrationNumber: s.reg_no || '', name: s.name || '', status: 'unmarked', studentId: s.id }));
			saveStudents(mapped);
		} catch (_) {
			saveStudents([]);
		}
		
		ensureTodaySession();
		initDashboard();
		show('dashboard');
	});

	if (els.studentsList) els.studentsList.addEventListener('click', (e) => {
		const targetEl = e.target;
		if (!(targetEl instanceof HTMLElement)) return;
		const button = targetEl.closest('button[data-index][data-status]');
		if (!(button instanceof HTMLElement)) return;
		const index = button.getAttribute('data-index');
		const status = button.getAttribute('data-status');
		if (index !== null && status) {
			updateStatus(Number(index), status);
		}
	});

	if (els.downloadBtn) els.downloadBtn.addEventListener('click', downloadTodayCsv);
	if (els.resetBtn) els.resetBtn.addEventListener('click', () => {
		setAttendanceDate('');
		ensureTodaySession();
		renderStudents();
	});
	if (els.manageUnitBtn) els.manageUnitBtn.addEventListener('click', () => show('unit'));
	if (els.logout1) els.logout1.addEventListener('click', logout);
	if (els.logout2) els.logout2.addEventListener('click', logout);
	
	// Add event listener for the new header logout button
	const headerLogoutBtn = document.getElementById('logout-btn');
	if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', logout);

	const backBtn = document.getElementById('back-btn');
	if (backBtn) backBtn.addEventListener('click', () => {
		const auth = getAuth();
		if (!auth.loggedIn) {
			show('auth');
			setTab('login');
			return;
		}
		const unit = getUnit();
		const dashboardVisible = !views.dashboard.classList.contains('hidden');
		if (dashboardVisible) {
			show('unit');
		} else if (unit) {
			initDashboard();
			show('dashboard');
		} else {
			show('auth');
		}
	});

	function logout() {
		setAuth({ loggedIn: false });
		show('auth');
	}

	// ✅ fixed version of initDashboard
	function initDashboard() {
		const unit = getUnit();
		const auth = getAuth();
		const lecturers = getLecturers();
		const user = lecturers.find(l => l.email === auth.email);
		
		// Update header elements
		const lecturerNameEl = document.getElementById('lecturer-name');
		const unitTitleEl = document.getElementById('unit-title');
		const dateEl = document.getElementById('header-date');
		
		if (user && lecturerNameEl) lecturerNameEl.textContent = user.name;
		if (unitTitleEl) unitTitleEl.textContent = `${unit?.code || ''} — ${unit?.name || ''}`;
		if (dateEl) {
			const d = new Date();
			dateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
		}
		
		ensureTodaySession();

		// Always fetch all students from backend
		apiGet(`/students.php`).then(resp => {
			// Handle both array or { students: [...] }
			const studentsArray = Array.isArray(resp) ? resp : resp.students || [];
			const mapped = studentsArray.map(s => ({
				studentId: s.id,
				name: s.name || '',
				registrationNumber: s.reg_no || '', // map DB column
				status: 'unmarked'
			}));
			saveStudents(mapped);
			renderStudents();
		}).catch(err => {
			console.warn('Could not load students from API, falling back:', err);
			renderStudents();
		});
	}

	// 3D Scene variables
	let scene, camera, renderer, raycaster, mouse;
	let buildings = [];

	function init3DScene() {
		const canvas = document.getElementById('3d-canvas');
		if (!canvas) return;

		// Scene setup
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87CEEB); // Sky blue

		// Camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(0, 5, 10);

		// Renderer
		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(window.innerWidth, window.innerHeight);

		// Controls
		const controls = new THREE.OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.screenSpacePanning = false;
		controls.minDistance = 5;
		controls.maxDistance = 50;
		controls.maxPolarAngle = Math.PI / 2;

		// Ground
		const groundGeometry = new THREE.PlaneGeometry(50, 50);
		const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
		const ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = -1;
		scene.add(ground);

		// Buildings
		const buildingData = [
			{ name: 'admin', color: 0x000080, pos: [-5, 0, 0], size: [2, 3, 2] }, // Blue admin
			{ name: 'faculty', color: 0x008000, pos: [0, 0, 0], size: [3, 4, 3] }, // Green faculty
			{ name: 'student', color: 0xFFFF00, pos: [5, 0, 0], size: [2, 2, 2] } // Yellow student
		];

		buildingData.forEach(data => {
			const geometry = new THREE.BoxGeometry(...data.size);
			const material = new THREE.MeshLambertMaterial({ color: data.color });
			const building = new THREE.Mesh(geometry, material);
			building.position.set(...data.pos);
			building.userData = { name: data.name };
			buildings.push(building);
			scene.add(building);
		});

		// Lights
		const ambientLight = new THREE.AmbientLight(0x404040);
		scene.add(ambientLight);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(10, 10, 5);
		scene.add(directionalLight);

		// Raycaster for clicks
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();

		canvas.addEventListener('click', onCanvasClick);

		// Animate
		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}
		animate();
	}

	function onCanvasClick(event) {
		const canvas = document.getElementById('3d-canvas');
		const rect = canvas.getBoundingClientRect();
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		const intersects = raycaster.intersectObjects(buildings);

		if (intersects.length > 0) {
			const building = intersects[0].object;
			const auth = getAuth();
			if (building.userData.name === 'faculty' && auth.role === 'faculty') {
				show('unit'); // Select course first
			} else if (building.userData.name === 'student' && auth.role === 'student') {
				show('studentDashboard');
			} else if (building.userData.name === 'admin' && auth.role === 'admin') {
				show('adminPanel');
			} else {
				alert('Access denied for your role.');
			}
		}
	}

	function loadFacultyDashboard() {
		const unit = getUnit();
		if (!unit) return;
		document.getElementById('faculty-course-title').textContent = `Mark Attendance for ${unit.title}`;
		// Load students for course
		apiGet(`/students.php?course_id=${unit.id}`).then(resp => {
			const list = document.getElementById('faculty-students-list');
			list.innerHTML = '';
			resp.forEach(student => {
				const row = document.createElement('div');
				row.className = 'list-item';
				row.innerHTML = `
					<div>${student.name}</div>
					<div>${student.reg_no}</div>
					<div class="status-group">
						<button class="status-present" data-enrollment="${student.enrollment_id}">Present</button>
						<button class="status-absent" data-enrollment="${student.enrollment_id}">Absent</button>
					</div>
				`;
				list.appendChild(row);
			});
		}).catch(err => console.error('Load students failed:', err));
	}

	function loadStudentDashboard() {
		// Load own attendance
		apiGet('/attendance.php').then(resp => {
			const list = document.getElementById('student-attendance-list');
			list.innerHTML = resp.map(a => `<div>${a.date}: ${a.status} - ${a.title}</div>`).join('');
			// Chart.js pie for status counts
			const ctx = document.getElementById('student-chart').getContext('2d');
			const counts = resp.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
			new Chart(ctx, {
				type: 'pie',
				data: {
					labels: Object.keys(counts),
					datasets: [{ data: Object.values(counts), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
				}
			});
		}).catch(err => console.error('Load attendance failed:', err));
	}

	function loadAdminPanel() {
		// Load courses for select
		apiGet('/units.php').then(resp => {
			const select = document.getElementById('admin-course-select');
			select.innerHTML = '<option value="">All Courses</option>';
			resp.forEach(course => {
				select.innerHTML += `<option value="${course.id}">${course.code} - ${course.title}</option>`;
			});
		}).catch(err => console.error('Load courses failed:', err));
	}

	// Comprehensive Dashboard Functions
	let lecturerUnits = [];
	let currentUnit = null;
	let currentStudent = null;

	function updateDataFreshness() {
		const now = new Date();
		const timeString = now.toLocaleTimeString();
		const updateTimeEl = document.getElementById('update-time');
		if (updateTimeEl) {
			updateTimeEl.textContent = timeString;
		}
	}

	function loadLecturerDashboard() {
		updateDataFreshness();
		loadLecturerUnits();
		setupDashboardFilters();
	}

	async function loadLecturerUnits() {
		try {
			// Simulate loading lecturer's units
			lecturerUnits = [
				{
					id: 1,
					code: 'COMP 101',
					title: 'Introduction to Programming',
					year: 1,
					status: 'active', // active, completed, upcoming
					schedule: 'Mon 10:00-11:30',
					nextSession: '2024-01-15 10:00'
				},
				{
					id: 2,
					code: 'MATH 201',
					title: 'Calculus II',
					year: 2,
					status: 'upcoming',
					schedule: 'Wed 14:00-15:30',
					nextSession: '2024-01-17 14:00'
				},
				{
					id: 3,
					code: 'ENG 301',
					title: 'Advanced Algorithms',
					year: 3,
					status: 'completed',
					schedule: 'Fri 09:00-10:30',
					nextSession: '2024-01-19 09:00'
				}
			];
			
			renderUnitsGrid();
		} catch (err) {
			console.error('Failed to load lecturer units:', err);
		}
	}

	function renderUnitsGrid() {
		const unitsGrid = document.getElementById('units-grid');
		if (!unitsGrid) return;

		unitsGrid.innerHTML = lecturerUnits.map(unit => `
			<div class="unit-card" data-unit-id="${unit.id}" onclick="selectUnit(${unit.id})">
				<h4>${unit.code} - ${unit.title}</h4>
				<p>Year ${unit.year} • ${unit.schedule}</p>
				<p>Next: ${new Date(unit.nextSession).toLocaleDateString()}</p>
				<span class="unit-status ${unit.status}">${unit.status.toUpperCase()}</span>
			</div>
		`).join('');
	}

	function selectUnit(unitId) {
		const unit = lecturerUnits.find(u => u.id === unitId);
		if (!unit) return;

		currentUnit = unit;
		loadAttendanceRoster(unit);
		show('attendanceRoster');
	}

	function loadAttendanceRoster(unit) {
		// Update header
		const unitTitleEl = document.getElementById('roster-unit-title');
		const sessionInfoEl = document.getElementById('roster-session-info');
		const rosterDateEl = document.getElementById('roster-date');
		
		if (unitTitleEl) unitTitleEl.textContent = `${unit.code} - ${unit.title}`;
		if (sessionInfoEl) sessionInfoEl.textContent = `${unit.schedule} - Session Date:`;
		if (rosterDateEl) rosterDateEl.textContent = new Date().toLocaleDateString();

		// Load students for this unit
		loadUnitStudents(unit.id);
	}

	async function loadUnitStudents(unitId) {
		try {
			const resp = await apiGet(`/unit_students.php?unit_code=${encodeURIComponent(currentUnit.code)}`);
			const students = resp.students || [];
			
			renderRosterStudents(students);
			updateAttendanceSummary(students);
		} catch (err) {
			console.error('Failed to load unit students:', err);
			// Fallback to demo data
			const demoStudents = [
				{ id: 1, name: 'Alice Johnson', reg_no: 'CS001', status: 'unmarked' },
				{ id: 2, name: 'Bob Smith', reg_no: 'CS002', status: 'present' },
				{ id: 3, name: 'Carol Davis', reg_no: 'CS003', status: 'absent' },
				{ id: 4, name: 'David Wilson', reg_no: 'CS004', status: 'tardy' },
				{ id: 5, name: 'Emma Brown', reg_no: 'CS005', status: 'unmarked' }
			];
			renderRosterStudents(demoStudents);
			updateAttendanceSummary(demoStudents);
		}
	}

	function renderRosterStudents(students) {
		const rosterList = document.getElementById('roster-students-list');
		if (!rosterList) return;

		rosterList.innerHTML = students.map(student => `
			<div class="roster-item">
				<div>
					<span class="student-name-link" onclick="showStudentHistory(${student.id}, '${student.name}', '${student.reg_no}')">
						${student.name}
					</span>
				</div>
				<div>${student.reg_no}</div>
				<div>
					<span class="status-badge ${student.status}">${student.status.toUpperCase()}</span>
				</div>
				<div class="status-buttons">
					<button class="status-btn present large ${student.status === 'present' ? 'active' : ''}" 
						onclick="updateStudentStatus(${student.id}, 'present')">Present</button>
					<button class="status-btn absent large ${student.status === 'absent' ? 'active' : ''}" 
						onclick="updateStudentStatus(${student.id}, 'absent')">Absent</button>
					<button class="status-btn tardy quick ${student.status === 'tardy' ? 'active' : ''}" 
						onclick="updateStudentStatus(${student.id}, 'tardy')">Tardy</button>
					<button class="status-btn excused quick ${student.status === 'excused' ? 'active' : ''}" 
						onclick="updateStudentStatus(${student.id}, 'excused')">Excused</button>
				</div>
			</div>
		`).join('');
		
		// Update absentee alerts
		updateAbsenteeAlerts(students);
	}

	function updateStudentStatus(studentId, status) {
		// Find and update student status
		const rosterItems = document.querySelectorAll('.roster-item');
		rosterItems.forEach(item => {
			const buttons = item.querySelectorAll('.status-btn');
			buttons.forEach(btn => {
				if (btn.onclick && btn.onclick.toString().includes(studentId)) {
					btn.classList.remove('active');
					if (btn.classList.contains(status)) {
						btn.classList.add('active');
					}
				}
			});
		});
		
		// Update attendance summary
		const students = Array.from(rosterItems).map(item => ({
			status: item.querySelector('.status-btn.active')?.classList[1] || 'unmarked'
		}));
		updateAttendanceSummary(students);
	}

	function updateAttendanceSummary(students) {
		const presentCount = students.filter(s => s.status === 'present').length;
		const totalCount = students.length;
		const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

		const presentEl = document.getElementById('present-count');
		const totalEl = document.getElementById('total-count');
		const rateEl = document.getElementById('attendance-rate');

		if (presentEl) presentEl.textContent = presentCount;
		if (totalEl) totalEl.textContent = totalCount;
		if (rateEl) rateEl.textContent = `${rate}%`;
	}

	function setupDashboardFilters() {
		const gradeFilter = document.getElementById('grade-filter');
		const studentSearch = document.getElementById('student-search');

		if (gradeFilter) {
			gradeFilter.addEventListener('change', filterUnits);
		}
		if (studentSearch) {
			studentSearch.addEventListener('input', filterUnits);
		}
	}

	function filterUnits() {
		const gradeFilter = document.getElementById('grade-filter');
		const studentSearch = document.getElementById('student-search');
		
		const selectedGrade = gradeFilter?.value;
		const searchTerm = studentSearch?.value.toLowerCase();

		const filteredUnits = lecturerUnits.filter(unit => {
			const matchesGrade = !selectedGrade || unit.year.toString() === selectedGrade;
			const matchesSearch = !searchTerm || 
				unit.code.toLowerCase().includes(searchTerm) || 
				unit.title.toLowerCase().includes(searchTerm);
			return matchesGrade && matchesSearch;
		});

		// Re-render with filtered units
		const unitsGrid = document.getElementById('units-grid');
		if (unitsGrid) {
			unitsGrid.innerHTML = filteredUnits.map(unit => `
				<div class="unit-card" data-unit-id="${unit.id}" onclick="selectUnit(${unit.id})">
					<h4>${unit.code} - ${unit.title}</h4>
					<p>Year ${unit.year} • ${unit.schedule}</p>
					<p>Next: ${new Date(unit.nextSession).toLocaleDateString()}</p>
					<span class="unit-status ${unit.status}">${unit.status.toUpperCase()}</span>
				</div>
			`).join('');
		}
	}

	function loadStudentProgress(studentId, studentName, unitCode) {
		currentStudent = { id: studentId, name: studentName, unitCode };
		
		// Update header
		const studentNameEl = document.getElementById('student-name');
		const progressUnitEl = document.getElementById('progress-unit');
		const progressUpdateTime = document.getElementById('progress-update-time');
		
		if (studentNameEl) studentNameEl.textContent = `${studentName} - CS${studentId.toString().padStart(3, '0')}`;
		if (progressUnitEl) progressUnitEl.textContent = `${unitCode} - ${currentUnit?.title || ''}`;
		if (progressUpdateTime) progressUpdateTime.textContent = new Date().toLocaleTimeString();

		// Load student data
		loadStudentKPIs();
		loadStudentAssessments();
		loadStudentAttendanceCalendar();
		loadInterventionLog();
		loadMissingWorkAlerts();
		drawScoreComparisonChart();
		
		show('studentProgress');
	}

	function loadStudentKPIs() {
		// Simulate KPI data
		const currentGrade = 78;
		const attendancePercentage = 85;
		const riskStatus = attendancePercentage < 80 || currentGrade < 70 ? 'high' : 
						   attendancePercentage < 85 || currentGrade < 75 ? 'medium' : 'low';

		// Update KPI displays
		const gradeEl = document.getElementById('current-grade');
		const attendanceEl = document.getElementById('attendance-percentage');
		const riskEl = document.getElementById('risk-status');

		if (gradeEl) gradeEl.textContent = `${currentGrade}%`;
		if (attendanceEl) attendanceEl.textContent = `${attendancePercentage}%`;
		if (riskEl) {
			riskEl.textContent = `${riskStatus.toUpperCase()} RISK`;
			riskEl.className = `risk-badge ${riskStatus}`;
		}

		// Draw grade gauge
		drawGradeGauge(currentGrade);
	}

	function drawGradeGauge(grade) {
		const canvas = document.getElementById('grade-gauge');
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 50;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = '#2a355f';
		ctx.lineWidth = 8;
		ctx.stroke();

		// Draw progress arc
		const progress = (grade / 100) * 2 * Math.PI;
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress);
		
		// Color based on grade
		let color = '#ef4444'; // Red
		if (grade >= 80) color = '#22c55e'; // Green
		else if (grade >= 70) color = '#f59e0b'; // Yellow
		
		ctx.strokeStyle = color;
		ctx.lineWidth = 8;
		ctx.lineCap = 'round';
		ctx.stroke();
	}

	function loadStudentAssessments() {
		const assessments = [
			{ name: 'CAT 1', weight: 20, score: 75, classAvg: 72, status: 'Completed' },
			{ name: 'CAT 2', weight: 20, score: 82, classAvg: 78, status: 'Completed' },
			{ name: 'Mid-Term', weight: 30, score: 0, classAvg: 0, status: 'Pending' },
			{ name: 'Final Exam', weight: 30, score: 0, classAvg: 0, status: 'Pending' }
		];

		const assessmentList = document.getElementById('assessment-list');
		if (!assessmentList) return;

		assessmentList.innerHTML = assessments.map(assessment => `
			<div class="assessment-item">
				<div>${assessment.name}</div>
				<div>${assessment.weight}%</div>
				<div>${assessment.score || '--'}</div>
				<div>${assessment.classAvg || '--'}</div>
				<div>${assessment.status}</div>
			</div>
		`).join('');
	}

	function loadStudentAttendanceCalendar() {
		const calendarGrid = document.getElementById('calendar-grid');
		if (!calendarGrid) return;

		// Generate calendar for current month
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		
		let calendarHTML = '';
		for (let day = 1; day <= daysInMonth; day++) {
			const statuses = ['present', 'absent', 'tardy', 'excused'];
			const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
			calendarHTML += `<div class="calendar-day ${randomStatus}">${day}</div>`;
		}
		
		calendarGrid.innerHTML = calendarHTML;
	}

	function loadInterventionLog() {
		const interventionEntries = document.getElementById('intervention-entries');
		if (!interventionEntries) return;

		const interventions = [
			{ timestamp: '2024-01-10 14:30', note: 'Discussed attendance concerns with student' },
			{ timestamp: '2024-01-08 10:15', note: 'Emailed student about missing assignments' }
		];

		interventionEntries.innerHTML = interventions.map(intervention => `
			<div class="intervention-entry">
				<div class="intervention-timestamp">${intervention.timestamp}</div>
				<div class="intervention-note">${intervention.note}</div>
			</div>
		`).join('');
	}

	// Enhanced Functions for Comprehensive Dashboard
	function updateAbsenteeAlerts(students) {
		const absenteeAlerts = document.getElementById('absentee-alerts');
		const absentStudentsList = document.getElementById('absent-students-list');
		
		if (!absenteeAlerts || !absentStudentsList) return;

		const absentStudents = students.filter(s => s.status === 'absent');
		
		if (absentStudents.length === 0) {
			absenteeAlerts.classList.add('hidden');
			return;
		}

		absenteeAlerts.classList.remove('hidden');
		absentStudentsList.innerHTML = absentStudents.map(student => `
			<div class="absent-student-item">
				<div class="absent-student-info">
					<div class="absent-student-name">${student.name}</div>
					<div class="absent-student-details">
						Last Present: ${getLastPresentDate(student.id)} | 
						Contact: ${student.email || 'N/A'}
					</div>
				</div>
				<div class="contact-actions">
					<button class="contact-btn" onclick="emailParent('${student.email}')">📧 Email</button>
					<button class="contact-btn" onclick="smsParent('${student.phone || 'N/A'}')">📱 SMS</button>
				</div>
			</div>
		`).join('');
	}

	function getLastPresentDate(studentId) {
		// Simulate last present date - in real app, this would come from database
		const dates = ['2024-01-15', '2024-01-12', '2024-01-10', '2024-01-08'];
		return dates[Math.floor(Math.random() * dates.length)];
	}

	function showStudentHistory(studentId, studentName, regNo) {
		const modal = document.getElementById('student-history-modal');
		const modalStudentName = document.getElementById('modal-student-name');
		
		if (!modal || !modalStudentName) return;

		modalStudentName.textContent = `${studentName} - ${regNo}`;
		
		// Load student history data
		loadStudentHistoryData(studentId);
		
		modal.classList.remove('hidden');
	}

	function loadStudentHistoryData(studentId) {
		// Simulate loading student history
		const totalSessions = 30;
		const presentCount = Math.floor(Math.random() * 25) + 20;
		const absentCount = totalSessions - presentCount;
		const attendanceRate = Math.round((presentCount / totalSessions) * 100);

		// Update summary
		document.getElementById('total-sessions').textContent = totalSessions;
		document.getElementById('total-present').textContent = presentCount;
		document.getElementById('total-absent').textContent = absentCount;
		document.getElementById('total-attendance-rate').textContent = `${attendanceRate}%`;

		// Generate history calendar
		generateHistoryCalendar();
		
		// Load notes history
		loadNotesHistory(studentId);
	}

	function generateHistoryCalendar() {
		const historyGrid = document.getElementById('history-calendar-grid');
		if (!historyGrid) return;

		// Generate 30-day calendar
		let calendarHTML = '';
		for (let day = 1; day <= 30; day++) {
			const statuses = ['present', 'absent', 'tardy', 'excused'];
			const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
			calendarHTML += `<div class="calendar-day ${randomStatus}" title="Day ${day} - ${randomStatus}">${day}</div>`;
		}
		
		historyGrid.innerHTML = calendarHTML;
	}

	function loadNotesHistory(studentId) {
		const notesHistory = document.getElementById('notes-history');
		if (!notesHistory) return;

		const notes = [
			{ timestamp: '2024-01-15 10:30', content: 'Student arrived 15 minutes late - traffic issues' },
			{ timestamp: '2024-01-12 09:15', content: 'Excused absence - medical appointment' },
			{ timestamp: '2024-01-10 14:20', content: 'Excellent participation in class discussion' }
		];

		notesHistory.innerHTML = notes.map(note => `
			<div class="note-history-item">
				<div class="note-history-timestamp">${note.timestamp}</div>
				<div class="note-history-content">${note.content}</div>
			</div>
		`).join('');
	}

	function emailParent(email) {
		if (email && email !== 'N/A') {
			window.open(`mailto:${email}?subject=Student Attendance Concern&body=Dear Parent/Guardian,%0D%0A%0D%0AWe are contacting you regarding your child's attendance. Please contact us if you have any questions.%0D%0A%0D%0ABest regards,%0D%0ASchool Administration`);
		} else {
			alert('Email address not available for this student.');
		}
	}

	function smsParent(phone) {
		if (phone && phone !== 'N/A') {
			alert(`SMS functionality would send a message to: ${phone}\n\nIn a real application, this would integrate with an SMS service.`);
		} else {
			alert('Phone number not available for this student.');
		}
	}

	function updateAttendanceNotes() {
		const notesInput = document.getElementById('attendance-notes-input');
		const notesTimestamp = document.getElementById('notes-timestamp');
		
		if (notesInput && notesTimestamp) {
			const now = new Date();
			notesTimestamp.textContent = `Last updated: ${now.toLocaleString()}`;
		}
	}

	function loadMissingWorkAlerts() {
		const missingWorkAlert = document.getElementById('missing-work-alert');
		const missingAssignments = document.getElementById('missing-assignments');
		
		if (!missingWorkAlert || !missingAssignments) return;

		const missingWork = [
			{ name: 'CAT 1', due: '2024-01-20' },
			{ name: 'Assignment 3', due: '2024-01-22' }
		];

		if (missingWork.length === 0) {
			missingWorkAlert.classList.add('hidden');
			return;
		}

		missingWorkAlert.classList.remove('hidden');
		missingAssignments.innerHTML = missingWork.map(work => `
			<div class="missing-assignment-item">
				<div>
					<div class="missing-assignment-name">${work.name}</div>
					<div class="missing-assignment-due">Due: ${work.due}</div>
				</div>
				<button class="contact-btn" onclick="alert('Link to LMS would open here')">View in LMS</button>
			</div>
		`).join('');
	}

	function drawScoreComparisonChart() {
		const canvas = document.getElementById('score-comparison-chart');
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		
		// Sample data
		const assessments = ['CAT 1', 'CAT 2', 'Mid-Term', 'Final'];
		const studentScores = [75, 82, 0, 0];
		const classAverages = [72, 78, 0, 0];

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw horizontal bar chart
		const barHeight = 30;
		const spacing = 50;
		const startY = 50;

		assessments.forEach((assessment, index) => {
			const y = startY + (index * spacing);
			const studentScore = studentScores[index];
			const classAvg = classAverages[index];

			// Draw assessment label
			ctx.fillStyle = '#e9eeff';
			ctx.font = '14px Arial';
			ctx.fillText(assessment, 10, y + 20);

			if (studentScore > 0 && classAvg > 0) {
				// Draw class average bar
				const classBarWidth = (classAvg / 100) * 200;
				ctx.fillStyle = '#6b7280';
				ctx.fillRect(150, y, classBarWidth, barHeight);

				// Draw student score bar
				const studentBarWidth = (studentScore / 100) * 200;
				ctx.fillStyle = studentScore >= classAvg ? '#22c55e' : '#ef4444';
				ctx.fillRect(150, y + 35, studentBarWidth, barHeight);

				// Draw scores
				ctx.fillStyle = '#e9eeff';
				ctx.font = '12px Arial';
				ctx.fillText(`${classAvg}%`, 160 + classBarWidth, y + 18);
				ctx.fillText(`${studentScore}%`, 160 + studentBarWidth, y + 53);
			} else {
				ctx.fillStyle = '#9aa4bf';
				ctx.fillText('Pending', 160, y + 20);
			}
		});

		// Draw legend
		ctx.fillStyle = '#e9eeff';
		ctx.font = '12px Arial';
		ctx.fillText('Class Average', 150, startY - 10);
		ctx.fillStyle = '#22c55e';
		ctx.fillText('Student Score', 150, startY + 5);
	}

	// Event listeners for new features
	function setupEnhancedEventListeners() {
		// Attendance notes
		const notesInput = document.getElementById('attendance-notes-input');
		if (notesInput) {
			notesInput.addEventListener('input', updateAttendanceNotes);
		}

		// Close modal
		const closeModal = document.getElementById('close-modal');
		if (closeModal) {
			closeModal.addEventListener('click', () => {
				const modal = document.getElementById('student-history-modal');
				if (modal) modal.classList.add('hidden');
			});
		}

		// Email/SMS buttons
		const emailStudentBtn = document.getElementById('email-student');
		const emailAdvisorBtn = document.getElementById('email-advisor');
		const smsParentBtn = document.getElementById('sms-parent');

		if (emailStudentBtn) {
			emailStudentBtn.addEventListener('click', () => {
				const email = currentStudent?.email || 'student@example.com';
				window.open(`mailto:${email}?subject=Attendance Concern&body=Dear Student,%0D%0A%0D%0AWe are reaching out regarding your attendance record. Please contact us if you have any questions.%0D%0A%0D%0ABest regards,%0D%0AYour Lecturer`);
			});
		}

		if (emailAdvisorBtn) {
			emailAdvisorBtn.addEventListener('click', () => {
				window.open(`mailto:advisor@school.edu?subject=Student Attendance Alert&body=Dear Academic Advisor,%0D%0A%0D%0AThis student may need academic support based on their attendance record.%0D%0A%0D%0AStudent: ${currentStudent?.name || 'N/A'}%0D%0AUnit: ${currentUnit?.title || 'N/A'}%0D%0A%0D%0ABest regards,%0D%0AYour Lecturer`);
			});
		}

		if (smsParentBtn) {
			smsParentBtn.addEventListener('click', () => {
				alert('SMS functionality would integrate with a messaging service to contact parents/guardians.');
			});
		}

		// Intervention form
		const interventionForm = document.getElementById('intervention-form');
		if (interventionForm) {
			interventionForm.addEventListener('submit', (e) => {
				e.preventDefault();
				const note = document.getElementById('intervention-note').value;
				if (note.trim()) {
					addInterventionEntry(note);
					document.getElementById('intervention-note').value = '';
				}
			});
		}
	}

	function addInterventionEntry(note) {
		const interventionEntries = document.getElementById('intervention-entries');
		if (!interventionEntries) return;

		const now = new Date();
		const timestamp = now.toLocaleString();
		
		const newEntry = document.createElement('div');
		newEntry.className = 'intervention-entry';
		newEntry.innerHTML = `
			<div class="intervention-timestamp">${timestamp}</div>
			<div class="intervention-note">${note}</div>
		`;
		
		interventionEntries.insertBefore(newEntry, interventionEntries.firstChild);
	}

	// Global functions for onclick handlers
	window.selectUnit = selectUnit;
	window.updateStudentStatus = updateStudentStatus;
	window.showStudentHistory = showStudentHistory;
	window.emailParent = emailParent;
	window.smsParent = smsParent;
	window.goToDashboard = goToDashboard;

	function goToDashboard() {
		const auth = getAuth();
		if (auth.loggedIn) {
			if (auth.role === 'lecturer') {
				loadLecturerDashboard();
				show('lecturerDashboard');
			} else if (auth.role === 'admin') {
				loadAdminPanel();
				show('adminPanel');
			}
		} else {
			show('auth');
			setTab('login');
		}
	}

	// boot
	(function start() {
		// Setup enhanced event listeners
		setupEnhancedEventListeners();
		
		const auth = getAuth();
		if (!auth.loggedIn) { show('auth'); setTab('login'); return; }
		
		// Route based on role
		if (auth.role === 'lecturer') {
			loadLecturerDashboard();
			show('lecturerDashboard');
		} else if (auth.role === 'admin') {
			loadAdminPanel();
			show('adminPanel');
		} else {
			show('auth');
		}
	})();
})();
