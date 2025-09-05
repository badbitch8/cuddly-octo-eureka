(function () {
	const views = {
		auth: document.getElementById('auth-view'),
		unit: document.getElementById('unit-view'),
		dashboard: document.getElementById('dashboard-view')
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
	function getAuth() { return storage.get('auth', { loggedIn: false }); }
	function setAuth(v) { storage.set('auth', v); }

	function getLecturers() { return storage.get('lecturers', []); }
	function saveLecturers(list) { storage.set('lecturers', list); }

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
		updateBackButton(view);
	}

	function updateBackButton(view) {
		const backBtn = document.getElementById('back-btn');
		if (!backBtn) return;
		// Back logic: from signup -> login, from unit/dashboard -> auth (if logged out) or unit
		if (view === 'auth') {
			backBtn.classList.add('hidden');
		} else {
			backBtn.classList.remove('hidden');
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
					<button class="secondary status-present ${s.status === 'present' ? 'active' : ''}" data-index="${index}" data-status="present">Present</button>
					<button class="danger status-absent ${s.status === 'absent' ? 'active' : ''}" data-index="${index}" data-status="absent">Absent</button>
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
		if (!students[index]) return;
		students[index].status = status;
		saveStudents(students);
		renderStudents();
	}

	function downloadTodayCsv() {
		const unit = getUnit();
		const students = getStudents();
		const today = todayKey();
		
		// Filter to only include students marked as "present"
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
		// expects header with registrationNumber,name (order flexible)
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

	if (forms.signup) forms.signup.addEventListener('submit', (e) => {
		e.preventDefault();
		const name = document.getElementById('signup-name').value.trim();
		const email = document.getElementById('signup-email').value.trim().toLowerCase();
		const password = document.getElementById('signup-password').value;
		
		if (!name || !email || !password) {
			alert('Please fill in all fields');
			return;
		}
		
		const lecturers = getLecturers();
		if (lecturers.some(l => l.email === email)) {
			alert('An account with this email already exists. Please log in instead.');
			setTab('login');
			return;
		}
		
		lecturers.push({ name, email, password });
		saveLecturers(lecturers);
		setAuth({ loggedIn: true, email });
		els.lecturerName.textContent = name;
		if (getUnit()) {
			initDashboard();
			show('dashboard');
		} else {
			show('unit');
		}
	});

	if (forms.login) forms.login.addEventListener('submit', (e) => {
		e.preventDefault();
		const email = document.getElementById('login-email').value.trim().toLowerCase();
		const password = document.getElementById('login-password').value;
		
		if (!email || !password) {
			alert('Please enter both email and password');
			return;
		}
		
		const lecturers = getLecturers();
		const user = lecturers.find(l => l.email === email && l.password === password);
		if (!user) { 
			alert('Invalid email or password. Please check your credentials and try again.');
			return; 
		}
		
		setAuth({ loggedIn: true, email });
		els.lecturerName.textContent = user.name;
		if (getUnit()) { initDashboard(); show('dashboard'); } else { show('unit'); }
	});

	if (forms.unit) forms.unit.addEventListener('submit', async (e) => {
		e.preventDefault();
		const name = document.getElementById('unit-name').value.trim();
		const code = document.getElementById('unit-code').value.trim();
		const file = document.getElementById('students-file').files[0];
		saveUnit({ name, code });
		if (file) {
			const text = await file.text();
			const parsed = parseStudentsCsv(text);
			saveStudents(parsed);
		} else if (getStudents().length === 0) {
			// Add sample students for demonstration
			const sampleStudents = [
				{ registrationNumber: 'CS001', name: 'Alice Johnson', status: 'unmarked' },
				{ registrationNumber: 'CS002', name: 'Bob Smith', status: 'unmarked' },
				{ registrationNumber: 'CS003', name: 'Carol Davis', status: 'unmarked' },
				{ registrationNumber: 'CS004', name: 'David Wilson', status: 'unmarked' },
				{ registrationNumber: 'CS005', name: 'Emma Brown', status: 'unmarked' },
				{ registrationNumber: 'CS006', name: 'Frank Miller', status: 'unmarked' },
				{ registrationNumber: 'CS007', name: 'Grace Taylor', status: 'unmarked' },
				{ registrationNumber: 'CS008', name: 'Henry Anderson', status: 'unmarked' },
				{ registrationNumber: 'CS009', name: 'Ivy Thomas', status: 'unmarked' },
				{ registrationNumber: 'CS010', name: 'Jack Garcia', status: 'unmarked' }
			];
			saveStudents(sampleStudents);
		}
		ensureTodaySession();
		initDashboard();
		show('dashboard');
	});

	// Add student functionality removed - will be replaced with API integration

	if (els.studentsList) els.studentsList.addEventListener('click', (e) => {
		const target = e.target;
		if (!(target instanceof HTMLElement)) return;
		const index = target.getAttribute('data-index');
		const status = target.getAttribute('data-status');
		if (index !== null && status) updateStatus(Number(index), status);
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

	// Back button
	const backBtn = document.getElementById('back-btn');
	if (backBtn) backBtn.addEventListener('click', () => {
		const auth = getAuth();
		if (!auth.loggedIn) {
			// not logged in: back takes you to login form
			show('auth');
			setTab('login');
			return;
		}
		// logged in: from dashboard -> unit, from unit -> dashboard (if unit exists)
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

	function initDashboard() {
		const unit = getUnit();
		const auth = getAuth();
		const lecturers = getLecturers();
		const user = lecturers.find(l => l.email === auth.email);
		if (user) els.lecturerName.textContent = user.name;
		els.unitTitle.textContent = `${unit?.code || ''} — ${unit?.name || ''}`;
		const d = new Date();
		els.date.textContent = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
		ensureTodaySession();
		renderStudents();
	}

	// boot
	(function start() {
		const auth = getAuth();
		if (!auth.loggedIn) { show('auth'); setTab('login'); return; }
		if (!getUnit()) { show('unit'); return; }
		initDashboard();
		show('dashboard');
	})();
})();