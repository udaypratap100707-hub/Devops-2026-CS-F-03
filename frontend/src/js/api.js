/* REST API Wrapper Client for Enterprise 4-Panel Placement Platform */

const API_BASE = ((window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'placement_token';

const API = {
  // ---- session token -------------------------------------------------
  getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } },
  setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } },
  authHeaders() { const t = this.getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; },

  // ---- one place that talks to the backend -----------------------------
  async request(path, { method = 'GET', body, raw = false } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...this.authHeaders() },
      body: body ? JSON.stringify(body) : undefined
    });
    if (raw) return res;
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON response */ }
    if (res.status === 401 && this.getToken() && typeof App !== 'undefined') {
      App.sessionExpired();                      // token expired / revoked -> back to the login screen
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status; err.code = data && data.code;
      throw err;
    }
    return data;
  },
  qs(filters) { return new URLSearchParams(Object.entries(filters || {}).filter(([, v]) => v !== undefined && v !== '')).toString(); },

  // ---- Authentication -----------------------------------------------------
  login(email, password) { return this.request('/auth/login', { method: 'POST', body: { email, password } }); },
  register(userData) { return this.request('/auth/register', { method: 'POST', body: userData }); },
  me() { return this.request('/auth/me'); },

  // ---- Stats & Analytics (8 Key Cards) ----------------------------------
  getStats() { return this.request('/stats'); },

  // ---- Companies & company registration requests -------------------------
  getCompanies() { return this.request('/companies'); },
  createCompany(compData) { return this.request('/companies', { method: 'POST', body: compData }); },
  getCompanyRequests(status = 'all') { return this.request(`/company-requests?${this.qs({ status })}`); },
  reviewCompany(id, decision, reason = '') { return this.request(`/companies/${id}/review`, { method: 'PUT', body: { decision, reason } }); },

  // ---- Drives -----------------------------------------------------------------
  getDrives(filters = {}) { return this.request(`/drives?${this.qs(filters)}`); },
  createDrive(driveData) { return this.request('/drives', { method: 'POST', body: driveData }); },
  updateDrive(id, driveData) { return this.request(`/drives/${id}`, { method: 'PUT', body: driveData }); },

  // ---- Students ----------------------------------------------------------------
  getStudents(filters = {}) { return this.request(`/students?${this.qs(filters)}`); },
  updateStudent(id, studentData) { return this.request(`/students/${id}`, { method: 'PUT', body: studentData }); },
  exportStudentsUrl() { return `${API_BASE}/students/export`; },
  // The export needs the session token, so it is fetched and saved as a file (a plain link cannot send headers)
  async downloadStudentsCsv() {
    try {
      const res = await this.request('/students/export', { raw: true });
      if (!res.ok) throw new Error('Export failed');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await res.blob());
      a.download = 'Placement_Students_Report.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { showToast(err.message, 'error'); }
  },

  // ---- Applications --------------------------------------------------------------
  getApplications(filters = {}) { return this.request(`/applications?${this.qs(filters)}`); },
  applyToDrive(studentId, driveId) { return this.request('/applications', { method: 'POST', body: { studentId, driveId } }); },
  updateApplicationStatus(appId, statusData) { return this.request(`/applications/${appId}/status`, { method: 'PUT', body: statusData }); },

  // ---- Shortlists / Interviews / Placements / Notifications -----------------------
  getShortlists() { return this.request('/shortlists'); },
  getInterviews(filters = {}) { return this.request(`/interviews?${this.qs(filters)}`); },
  scheduleInterview(interviewData) { return this.request('/interviews', { method: 'POST', body: interviewData }); },
  getPlacements() { return this.request('/placements'); },
  getNotifications(filters = {}) { return this.request(`/notifications?${this.qs(filters)}`); },
  createNotification(noticeData) { return this.request('/notifications', { method: 'POST', body: noticeData }); }
};
