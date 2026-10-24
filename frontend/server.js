const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const os = require('os');
const pkg = require('./package.json');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'store.json');
const startedAt = Date.now();

app.use(cors());
app.use(express.json());
// Serve ./public if it exists (deploy build), otherwise the ./src folder shipped in this project
const STATIC_DIR = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : path.join(__dirname, 'src');
app.use(express.static(STATIC_DIR));

// =============================================================
// DEVOPS LAYER: security headers, request logging, metrics,
// rate limiting, health/version/metrics/docs endpoints
// =============================================================
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

const metrics = { total: 0, totalMs: 0, byStatus: {}, byMethod: {}, recent: [] };
const MONITOR_PATHS = ['/api/health', '/api/metrics', '/api/logs'];

app.use((req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    if (!req.originalUrl.startsWith('/api')) return;
    if (MONITOR_PATHS.some(p => req.originalUrl.startsWith(p))) return; // don't let the monitor spam itself
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    metrics.total++;
    metrics.totalMs += ms;
    const sc = String(res.statusCode);
    metrics.byStatus[sc] = (metrics.byStatus[sc] || 0) + 1;
    metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
    metrics.recent.unshift({
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10
    });
    if (metrics.recent.length > 100) metrics.recent.pop();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
    }
  });
  next();
});

// Tiny in-memory rate limiter (no extra dependency)
function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    let entry = hits.get(req.ip);
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many attempts. Please try again in a minute.' });
    }
    next();
  };
}
app.use('/api/auth', rateLimit(Number(process.env.AUTH_RATE_LIMIT) || 30, 60 * 1000));

const mb = (n) => Math.round((n / 1024 / 1024) * 10) / 10;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    dataStore: fs.existsSync(DATA_FILE) ? 'available' : 'missing'
  });
});

app.get('/api/version', (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    commit: process.env.GIT_SHA || 'local',
    startedAt: new Date(startedAt).toISOString()
  });
});

function snapshotMetrics() {
  const mem = process.memoryUsage();
  return {
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    requests: {
      total: metrics.total,
      avgLatencyMs: metrics.total ? Math.round((metrics.totalMs / metrics.total) * 10) / 10 : 0,
      byStatus: metrics.byStatus,
      byMethod: metrics.byMethod
    },
    memory: { rssMB: mb(mem.rss), heapUsedMB: mb(mem.heapUsed), heapTotalMB: mb(mem.heapTotal) },
    system: { platform: process.platform, cpus: os.cpus().length, loadAvg: os.loadavg().map(n => Math.round(n * 100) / 100) }
  };
}

app.get('/api/metrics', (req, res) => res.json(snapshotMetrics()));

// Prometheus text exposition format (scrape with Prometheus/Grafana)
app.get('/api/metrics/prometheus', (req, res) => {
  const m = snapshotMetrics();
  const lines = [
    '# HELP placement_uptime_seconds Process uptime in seconds',
    '# TYPE placement_uptime_seconds gauge',
    `placement_uptime_seconds ${m.uptimeSeconds}`,
    '# HELP placement_http_requests_total Total API requests by status code',
    '# TYPE placement_http_requests_total counter',
    ...Object.entries(m.requests.byStatus).map(([c, n]) => `placement_http_requests_total{status="${c}"} ${n}`),
    '# HELP placement_memory_rss_megabytes Resident memory in MB',
    '# TYPE placement_memory_rss_megabytes gauge',
    `placement_memory_rss_megabytes ${m.memory.rssMB}`
  ];
  res.type('text/plain').send(lines.join('\n') + '\n');
});

app.get('/api/logs', (req, res) => res.json(metrics.recent.slice(0, 50)));

// Self-documenting API (used by the "API Explorer" screen)
const API_DOCS = [
  { tag: 'Auth', method: 'POST', path: '/api/auth/login', desc: 'Sign in with email + password', body: { email: 'admin@campus.edu', password: 'admin123' } },
  { tag: 'Auth', method: 'POST', path: '/api/auth/register', desc: 'Create a student / recruiter / tpo / admin account', body: { name: 'Demo User', email: 'demo@campus.edu', password: 'demo123', role: 'student', branch: 'Computer Science', cgpa: 8.2 } },
  { tag: 'Analytics', method: 'GET', path: '/api/stats', desc: 'Dashboard statistics (8 key cards + branch breakdown)' },
  { tag: 'Companies', method: 'GET', path: '/api/companies', desc: 'List visiting companies' },
  { tag: 'Companies', method: 'POST', path: '/api/companies', desc: 'Add a company' },
  { tag: 'Drives', method: 'GET', path: '/api/drives', desc: 'List placement drives (supports filters)' },
  { tag: 'Drives', method: 'POST', path: '/api/drives', desc: 'Create a placement drive' },
  { tag: 'Drives', method: 'PUT', path: '/api/drives/:id', desc: 'Update a drive' },
  { tag: 'Students', method: 'GET', path: '/api/students', desc: 'List students' },
  { tag: 'Students', method: 'GET', path: '/api/students/export', desc: 'Export students' },
  { tag: 'Students', method: 'PUT', path: '/api/students/:id', desc: 'Update a student profile' },
  { tag: 'Applications', method: 'GET', path: '/api/applications', desc: 'List applications' },
  { tag: 'Applications', method: 'POST', path: '/api/applications', desc: 'Apply to a drive' },
  { tag: 'Applications', method: 'PUT', path: '/api/applications/:id/status', desc: 'Move an application through the pipeline' },
  { tag: 'Interviews', method: 'GET', path: '/api/shortlists', desc: 'List shortlists' },
  { tag: 'Interviews', method: 'GET', path: '/api/interviews', desc: 'List interviews' },
  { tag: 'Interviews', method: 'POST', path: '/api/interviews', desc: 'Schedule an interview' },
  { tag: 'Placements', method: 'GET', path: '/api/placements', desc: 'Placement ledger' },
  { tag: 'Notifications', method: 'GET', path: '/api/notifications', desc: 'List notifications' },
  { tag: 'Notifications', method: 'POST', path: '/api/notifications', desc: 'Broadcast a notification' },
  { tag: 'DevOps', method: 'GET', path: '/api/health', desc: 'Liveness/readiness probe (used by Docker + Kubernetes)' },
  { tag: 'DevOps', method: 'GET', path: '/api/version', desc: 'App version, Node version, commit SHA, environment' },
  { tag: 'DevOps', method: 'GET', path: '/api/metrics', desc: 'Uptime, memory, request counters (JSON)' },
  { tag: 'DevOps', method: 'GET', path: '/api/metrics/prometheus', desc: 'Same metrics in Prometheus format' },
  { tag: 'DevOps', method: 'GET', path: '/api/logs', desc: 'Last 50 API requests (for the live monitor)' }
];
app.get('/api/docs', (req, res) => res.json(API_DOCS));

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json:', err);
    return {
      users: [], students: [], companies: [], drives: [],
      applications: [], shortlists: [], interviews: [],
      placements: [], notifications: [], documents: []
    };
  }
}

function writeData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing store.json:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 0. AUTHENTICATION (LOGIN & SIGNUP / REGISTER)
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const data = readData();
  const users = data.users || [];

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || null,
      companyId: user.companyId || null
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, branch, cgpa, companyName } = req.body;
  const data = readData();

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  // Check if email exists
  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'USR' + String(Date.now()).slice(-4);
  let studentId = null;
  let companyId = null;

  // Role specific entity creation
  if (role === 'student') {
    studentId = 'STU' + String(Date.now()).slice(-4);
    const newStudent = {
      id: studentId,
      name,
      email,
      phone: '+91 98000 00000',
      branch: branch || 'Computer Science',
      cgpa: parseFloat(cgpa) || 7.5,
      class10Pct: 90.0,
      class12Pct: 88.0,
      backlogs: 0,
      graduationYear: 2026,
      skills: ['Programming', 'Problem Solving'],
      resumeUrl: 'https://example.com/resumes/default.pdf',
      status: 'Unplaced',
      offerPackage: '-',
      placedCompany: '-'
    };
    data.students.push(newStudent);
  } else if (role === 'recruiter') {
    companyId = 'COMP' + String(Date.now()).slice(-4);
    const newComp = {
      id: companyId,
      name: companyName || 'New Hiring Partner',
      sector: 'Technology & Enterprise',
      website: 'https://example.com',
      hrName: name,
      hrEmail: email,
      hrPhone: '+91 98000 00000',
      location: 'Bengaluru / Remote',
      rating: 4.5,
      status: 'Approved Partner'
    };
    data.companies.push(newComp);
  }

  const newUser = {
    id: userId,
    name,
    email,
    password,
    role,
    studentId,
    companyId
  };

  data.users.push(newUser);
  writeData(data);

  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      studentId: newUser.studentId,
      companyId: newUser.companyId
    }
  });
});

// -------------------------------------------------------------
// 1. STATS & ANALYTICS API (Computes all 8 Key Dashboard Cards)
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const data = readData();
  const students = data.students || [];
  const companies = data.companies || [];
  const drives = data.drives || [];
  const applications = data.applications || [];
  const shortlists = data.shortlists || [];
  const placements = data.placements || [];

  const totalStudents = students.length;
  const registeredStudents = students.filter(s => s.resumeUrl).length || totalStudents;
  const activeCompanies = companies.filter(c => c.status === 'Approved Partner').length;
  const activeDrives = drives.filter(d => d.status === 'Active').length;
  const totalApplications = applications.length;
  const shortlistedStudents = shortlists.length;
  const placedStudents = students.filter(s => s.status === 'Placed').length;

  const placementRate = totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

  let maxVal = 0;
  let sumVal = 0;
  let countVal = 0;

  students.filter(s => s.status === 'Placed').forEach(s => {
    if (s.offerPackage && s.offerPackage.includes('LPA')) {
      const v = parseFloat(s.offerPackage.replace('₹', '').replace('LPA', '').trim());
      if (!isNaN(v)) {
        if (v > maxVal) maxVal = v;
        sumVal += v;
        countVal++;
      }
    }
  });

  const avgPackage = countVal > 0 ? (sumVal / countVal).toFixed(2) + ' LPA' : '₹0.0 LPA';
  const highestPackage = maxVal > 0 ? `₹${maxVal.toFixed(1)} LPA` : '₹0.0 LPA';

  const branchMap = {};
  students.forEach(s => {
    if (!branchMap[s.branch]) {
      branchMap[s.branch] = { total: 0, placed: 0 };
    }
    branchMap[s.branch].total++;
    if (s.status === 'Placed') branchMap[s.branch].placed++;
  });

  const branchBreakdown = Object.keys(branchMap).map(b => ({
    branch: b,
    total: branchMap[b].total,
    placed: branchMap[b].placed,
    rate: ((branchMap[b].placed / branchMap[b].total) * 100).toFixed(0)
  }));

  res.json({
    totalStudents,
    registeredStudents,
    activeCompanies,
    activeDrives,
    totalApplications,
    shortlistedStudents,
    placedStudents,
    placementRate,
    highestPackage,
    avgPackage,
    branchBreakdown
  });
});

// -------------------------------------------------------------
// 2. COMPANIES MANAGEMENT API
// -------------------------------------------------------------
app.get('/api/companies', (req, res) => {
  const data = readData();
  res.json(data.companies || []);
});

app.post('/api/companies', (req, res) => {
  const data = readData();
  const newComp = {
    id: 'COMP' + String(Date.now()).slice(-4),
    name: req.body.name,
    sector: req.body.sector || 'Technology',
    website: req.body.website || 'https://example.com',
    hrName: req.body.hrName || 'HR Manager',
    hrEmail: req.body.hrEmail || 'hr@company.com',
    hrPhone: req.body.hrPhone || '+91 98000 00000',
    location: req.body.location || 'Remote',
    rating: parseFloat(req.body.rating) || 4.5,
    status: 'Approved Partner'
  };
  data.companies.unshift(newComp);
  writeData(data);
  res.status(201).json(newComp);
});

// -------------------------------------------------------------
// 3. PLACEMENT DRIVES API
// -------------------------------------------------------------
app.get('/api/drives', (req, res) => {
  const data = readData();
  const { companyId } = req.query;
  let drives = data.drives || [];
  if (companyId) {
    drives = drives.filter(d => d.companyId === companyId);
  }
  res.json(drives);
});

app.post('/api/drives', (req, res) => {
  const data = readData();
  const { company, companyId, role, ctc, minCgpa, maxBacklogs, eligibleBranches, location, deadline, description } = req.body;

  const newDrive = {
    id: 'DRV' + String(Date.now()).slice(-4),
    companyId: companyId || 'COMP001',
    company: company || 'Partner Company',
    role,
    ctc: ctc.includes('LPA') ? ctc : `₹${ctc} LPA`,
    minCgpa: parseFloat(minCgpa) || 6.0,
    maxBacklogs: parseInt(maxBacklogs, 10) || 0,
    eligibleBranches: Array.isArray(eligibleBranches) ? eligibleBranches : [eligibleBranches || 'All Branches'],
    location: location || 'Remote',
    deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Active',
    description: description || 'No detailed description provided.',
    rounds: ['Resume Screening', 'Online Assessment', 'Tech Interview 1', 'HR Round']
  };

  data.drives.unshift(newDrive);
  writeData(data);
  res.status(201).json(newDrive);
});

app.put('/api/drives/:id', (req, res) => {
  const data = readData();
  const idx = data.drives.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Drive not found.' });

  data.drives[idx] = { ...data.drives[idx], ...req.body };
  writeData(data);
  res.json(data.drives[idx]);
});

// -------------------------------------------------------------
// 4. STUDENTS API & EXPORT
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  const data = readData();
  let students = data.students || [];

  const { branch, minCgpa, status, search } = req.query;

  if (branch) students = students.filter(s => s.branch.toLowerCase() === branch.toLowerCase());
  if (minCgpa) students = students.filter(s => s.cgpa >= parseFloat(minCgpa));
  if (status) students = students.filter(s => s.status.toLowerCase() === status.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }

  res.json(students);
});

app.get('/api/students/export', (req, res) => {
  const data = readData();
  const students = data.students || [];

  let csv = 'ID,Name,Email,Phone,Branch,CGPA,Class10 %,Class12 %,Backlogs,Status,Placed Company,Offer Package\n';
  students.forEach(s => {
    csv += `"${s.id}","${s.name}","${s.email}","${s.phone}","${s.branch}",${s.cgpa},${s.class10Pct || 90},${s.class12Pct || 88},${s.backlogs},"${s.status}","${s.placedCompany}","${s.offerPackage}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Placement_Students_Report.csv"');
  res.status(200).send(csv);
});

app.put('/api/students/:id', (req, res) => {
  const data = readData();
  const idx = data.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found.' });

  data.students[idx] = { ...data.students[idx], ...req.body };
  writeData(data);
  res.json(data.students[idx]);
});

// -------------------------------------------------------------
// 5. APPLICATIONS & SHORTLISTING API
// -------------------------------------------------------------
app.get('/api/applications', (req, res) => {
  const data = readData();
  const { studentId, driveId, company } = req.query;

  let apps = data.applications || [];
  if (studentId) apps = apps.filter(a => a.studentId === studentId);
  if (driveId) apps = apps.filter(a => a.driveId === driveId);
  if (company) apps = apps.filter(a => a.company.toLowerCase() === company.toLowerCase());

  res.json(apps);
});

app.post('/api/applications', (req, res) => {
  const data = readData();
  const { studentId, driveId } = req.body;

  const student = data.students.find(s => s.id === studentId);
  const drive = data.drives.find(d => d.id === driveId);

  if (!student || !drive) return res.status(400).json({ error: 'Invalid Student ID or Drive ID.' });

  const existing = data.applications.find(a => a.studentId === studentId && a.driveId === driveId);
  if (existing) return res.status(400).json({ error: 'Already applied to this drive.' });

  if (student.cgpa < drive.minCgpa) return res.status(400).json({ error: `CGPA requirement not met (${student.cgpa} < Min ${drive.minCgpa})` });
  if (student.backlogs > drive.maxBacklogs) return res.status(400).json({ error: `Backlog limit exceeded (${student.backlogs} > Max ${drive.maxBacklogs})` });

  const today = new Date().toISOString().split('T')[0];
  const newApp = {
    id: 'APP' + String(Date.now()).slice(-4),
    studentId,
    driveId,
    company: drive.company,
    role: drive.role,
    appliedDate: today,
    status: 'Applied',
    currentStage: drive.rounds[0] || 'Applied',
    stageIndex: 0,
    history: [{ stage: drive.rounds[0] || 'Applied', date: today, note: 'Application submitted.' }]
  };

  data.applications.unshift(newApp);
  if (student.status === 'Unplaced') student.status = 'In Progress';

  writeData(data);
  res.status(201).json(newApp);
});

app.put('/api/applications/:id/status', (req, res) => {
  const data = readData();
  const { status, stage, note, offerPackage } = req.body;
  const appItem = data.applications.find(a => a.id === req.params.id);

  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  const today = new Date().toISOString().split('T')[0];
  if (status) appItem.status = status;
  if (stage) appItem.currentStage = stage;

  appItem.history.push({
    stage: stage || status || 'Updated',
    date: today,
    note: note || `Status updated to ${status || stage}`
  });

  if (status === 'Shortlisted') {
    const student = data.students.find(s => s.id === appItem.studentId);
    if (student) student.status = 'Shortlisted';
    if (!data.shortlists.find(sh => sh.driveId === appItem.driveId && sh.studentId === appItem.studentId)) {
      data.shortlists.push({
        id: 'SHL' + String(Date.now()).slice(-4),
        driveId: appItem.driveId,
        studentId: appItem.studentId,
        studentName: student ? student.name : appItem.studentId,
        company: appItem.company,
        status: 'Shortlisted'
      });
    }
  }

  if (status === 'Offer Accepted' || status === 'Selected') {
    const student = data.students.find(s => s.id === appItem.studentId);
    const drive = data.drives.find(d => d.id === appItem.driveId);
    if (student) {
      student.status = 'Placed';
      student.placedCompany = appItem.company;
      student.offerPackage = offerPackage || (drive ? drive.ctc : '₹12.0 LPA');

      data.placements.unshift({
        id: 'PLC' + String(Date.now()).slice(-4),
        studentId: student.id,
        studentName: student.name,
        branch: student.branch,
        company: appItem.company,
        role: appItem.role,
        package: student.offerPackage,
        placedDate: today,
        status: 'Offer Accepted'
      });
    }
  }

  writeData(data);
  res.json(appItem);
});

// -------------------------------------------------------------
// 6. SHORTLISTS API
// -------------------------------------------------------------
app.get('/api/shortlists', (req, res) => {
  const data = readData();
  res.json(data.shortlists || []);
});

// -------------------------------------------------------------
// 7. INTERVIEWS SCHEDULER API
// -------------------------------------------------------------
app.get('/api/interviews', (req, res) => {
  const data = readData();
  const { studentId, driveId } = req.query;
  let ints = data.interviews || [];
  if (studentId) ints = ints.filter(i => i.studentId === studentId);
  if (driveId) ints = ints.filter(i => i.driveId === driveId);
  res.json(ints);
});

app.post('/api/interviews', (req, res) => {
  const data = readData();
  const { driveId, studentId, studentName, company, roundName, date, time, meetingLink, interviewer } = req.body;

  const newInt = {
    id: 'INT' + String(Date.now()).slice(-4),
    driveId: driveId || 'DRV001',
    studentId: studentId || 'STU001',
    studentName: studentName || 'Candidate',
    company: company || 'Company',
    roundName: roundName || 'Technical Interview',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '10:00 AM - 11:00 AM',
    meetingLink: meetingLink || 'https://meet.google.com/demo',
    interviewer: interviewer || 'Recruiter Lead',
    status: 'Scheduled'
  };

  data.interviews.unshift(newInt);

  data.notifications.unshift({
    id: 'NTC' + String(Date.now()).slice(-4),
    title: `${company} Interview Allotted`,
    target: studentId,
    date: new Date().toISOString().split('T')[0],
    message: `${roundName} scheduled on ${date} at ${time}. Link: ${meetingLink}`
  });

  writeData(data);
  res.status(201).json(newInt);
});

// -------------------------------------------------------------
// 8. PLACEMENTS RESULTS API
// -------------------------------------------------------------
app.get('/api/placements', (req, res) => {
  const data = readData();
  res.json(data.placements || []);
});

// -------------------------------------------------------------
// 9. NOTIFICATIONS API
// -------------------------------------------------------------
app.get('/api/notifications', (req, res) => {
  const data = readData();
  const { target } = req.query;
  let notes = data.notifications || [];
  if (target) {
    notes = notes.filter(n => n.target === target || n.target === 'All Students' || n.target === 'All Users');
  }
  res.json(notes);
});

app.post('/api/notifications', (req, res) => {
  const data = readData();
  const newNote = {
    id: 'NTC' + String(Date.now()).slice(-4),
    title: req.body.title,
    target: req.body.target || 'All Students',
    date: new Date().toISOString().split('T')[0],
    message: req.body.message
  };

  data.notifications.unshift(newNote);
  writeData(data);
  res.status(201).json(newNote);
});

// Unknown API route -> JSON 404, unexpected errors -> JSON 500
app.use('/api', (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Internal server error' });
});

// Start Server (only when run directly, so tests can import `app`)
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(` Enterprise 4-Panel Placement Platform Active`);
    console.log(` Listening on port: ${PORT}`);
    console.log(`=================================================`);
  });

  // Graceful shutdown (docker stop / kubernetes rolling update send SIGTERM)
  const shutdown = (sig) => {
    console.log(`${sig} received, shutting down gracefully...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
