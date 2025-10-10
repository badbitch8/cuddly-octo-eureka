(function () {
	const API_BASE = storageGetEnv('API_BASE', 'http://localhost:8080/api');

	const views = {
		auth: document.getElementById('auth-view'),
		campus: document.getElementById('campus-view'),
		unit: document.getElementById('unit-view'),
		facultyDashboard: document.getElementById('faculty-dashboard'),
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
		const role = document.getElementById('signup-role').value;

		if (!name || !email || !password) {
			alert('Please fill in all fields');
			return;
		}

		try {
			const data = { action: 'create', name, email, password, role };
			if (role === 'student') {
				data.reg_no = prompt('Enter registration number:') || '';
				data.year_of_study = 1;
			}
			const resp = await apiJson('/students.php', 'POST', data);
			alert('Account created successfully!');
			setTab('login');
		} catch (err) {
			alert('Signup failed: ' + err.message);
		}
	});

	if (forms.login) forms.login.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = document.getElementById('login-email').value.trim().toLowerCase();
		const password = document.getElementById('login-password').value;

		if (!email || !password) {
			alert('Please enter both email and password');
			return;
		}

		try {
			const resp = await apiJson('/students.php', 'POST', { action: 'login', email, password });
			setAuth({ loggedIn: true, user: resp.user, role: resp.user.role, token: resp.token });
			els.lecturerName.textContent = resp.user.name;
			show('campus'); // Go to 3D campus after login
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

	// boot
	(function start() {
		const auth = getAuth();
		if (!auth.loggedIn) { show('auth'); setTab('login'); return; }
		show('campus'); // Start with 3D campus
	})();
})();
