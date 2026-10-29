/* Master Application Controller & Router across all 4 Panels */

const App = {
  activeRole: 'admin',      // 'admin', 'tpo', 'recruiter', or the student's own ID (e.g. 'STU4821')
  companyId: null,          // set for recruiter accounts
  activeView: 'admin-analytics',
  viewParams: {},
  currentUser: null,
  pendingCount: 0,          // company requests waiting for approval (admin / TPO badge)

  async init() {
    const savedUser = localStorage.getItem('placement_user');
    if (savedUser && API.getToken()) {
      try {
        const { user } = await API.me();      // validates the saved session with the backend
        this.currentUser = user;
        localStorage.setItem('placement_user', JSON.stringify(user));
        this.hideLoginScreen();
        this.applyUserRole(user);
      } catch (err) {
        this.clearSession();
        this.showLoginScreen();
        if (err.status === 403) showToast(err.message, 'error');
      }
    } else {
      this.clearSession();
      this.showLoginScreen();
    }
  },

  clearSession() {
    localStorage.removeItem('placement_user');
    API.setToken('');
    this.currentUser = null;
    this.companyId = null;
  },

  sessionExpired() {
    if (!this.currentUser) return;
    this.clearSession();
    this.showLoginScreen();
    showToast('Your session expired. Please sign in again.', 'info');
  },

  showLoginScreen() {
    const screen = document.getElementById('loginScreen');
    if (screen) screen.style.display = 'flex';
  },

  hideLoginScreen() {
    const screen = document.getElementById('loginScreen');
    if (screen) screen.style.display = 'none';
  },

  switchAuthTab(tabName) {
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const signInContainer = document.getElementById('signInContainer');
    const signUpContainer = document.getElementById('signUpContainer');

    if (tabName === 'signin') {
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      signInContainer.style.display = 'block';
      signUpContainer.style.display = 'none';
    } else {
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      signInContainer.style.display = 'none';
      signUpContainer.style.display = 'block';
    }
  },

  handleRegRoleChange() {
    const role = document.getElementById('regRole').value;
    const isCompany = role === 'recruiter';
    document.getElementById('regStudentFields').style.display = isCompany ? 'none' : 'block';
    document.getElementById('regRecruiterFields').style.display = isCompany ? 'block' : 'none';
    document.getElementById('regNameLabel').textContent = isCompany ? 'HR Contact Person Name' : 'Full Name';
    document.getElementById('regCompanyName').required = isCompany;
    document.getElementById('regSubmitLabel').textContent = isCompany ? 'Submit Company for Approval' : 'Complete Registration';
  },

  async handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await API.login(email, password);
      this.startSession(res);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  startSession(res) {
    API.setToken(res.token);
    this.currentUser = res.user;
    localStorage.setItem('placement_user', JSON.stringify(res.user));
    this.hideLoginScreen();
    this.applyUserRole(res.user);
  },

  async handleSignupForm(e) {
    e.preventDefault();
    const val = (id) => (document.getElementById(id) ? document.getElementById(id).value : '');
    const role = val('regRole');
    const userData = { role, name: val('regName'), email: val('regEmail'), password: val('regPassword') };
    if (role === 'student') {
      userData.branch = val('regBranch');
      userData.cgpa = parseFloat(val('regCgpa'));
    } else {
      userData.companyName = val('regCompanyName');
      userData.sector = val('regSector');
      userData.website = val('regWebsite');
      userData.location = val('regLocation');
      userData.hrPhone = val('regHrPhone');
    }

    try {
      const res = await API.register(userData);
      if (res.pending) {
        // Companies must be approved by the TPO / Admin before they can sign in
        e.target.reset();
        this.handleRegRoleChange();
        this.switchAuthTab('signin');
        document.getElementById('loginEmail').value = userData.email;
        openModal('Request submitted', `
          <div style="text-align:center; padding: 8px 4px;">
            <i class="ri-time-line" style="font-size: 2.6rem; color: var(--warning);"></i>
            <h3 style="margin: 10px 0 6px; color: var(--text-strong);">Awaiting approval</h3>
            <p style="color: var(--text-muted); line-height: 1.6;">${res.message}</p>
            <button class="btn btn-primary" style="margin-top: 18px;" onclick="closeModal()">Got it</button>
          </div>`);
        return;
      }
      this.startSession(res);
      showToast('Registration successful! Welcome to the portal.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  handleLogout() {
    this.clearSession();
    this.showLoginScreen();
    showToast('Logged out successfully.', 'info');
  },

  applyUserRole(user) {
    let roleVal = 'admin';
    if (user.role === 'tpo') roleVal = 'tpo';
    else if (user.role === 'recruiter') { roleVal = 'recruiter'; this.companyId = user.companyId; }
    else if (user.role === 'student') roleVal = user.studentId;
    this.switchRole(roleVal);
  },

  async switchRole(roleValue) {
    this.activeRole = roleValue;
    const user = this.currentUser || {};

    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const labelEl = document.getElementById('userRoleLabel');
    avatar.textContent = (user.name || '?').charAt(0).toUpperCase();
    nameEl.textContent = user.name || '';

    if (roleValue === 'admin') {
      avatar.style.background = 'var(--primary)';
      labelEl.textContent = 'System Administrator';
      this.renderAdminSidebar();
      this.navigateTo('admin-analytics');
    } else if (roleValue === 'tpo') {
      avatar.style.background = 'var(--secondary)';
      labelEl.textContent = 'Placement Officer (TPO)';
      this.renderTpoSidebar();
      this.navigateTo('tpo-dashboard');
    } else if (roleValue === 'recruiter') {
      avatar.style.background = 'var(--accent-cyan)';
      labelEl.textContent = `${user.companyName || 'Company'} Recruiter`;
      this.renderRecruiterSidebar(this.companyId);
      this.navigateTo('recruiter-dashboard', { companyId: this.companyId });
    } else {
      avatar.style.background = 'var(--warning)';
      labelEl.textContent = 'Student Candidate';
      this.renderStudentSidebar();
      this.navigateTo('student-overview');
      try {
        const [student] = await API.getStudents();
        if (student) labelEl.textContent = `${student.branch} Candidate`;
      } catch (err) { /* label stays generic */ }
    }
    this.refreshPendingBadge();
  },

  // Red badge on "Company Requests" for admin / TPO
  async refreshPendingBadge() {
    if (this.activeRole !== 'admin' && this.activeRole !== 'tpo') return;
    try {
      const pending = await API.getCompanyRequests('Pending Approval');
      this.pendingCount = pending.length;
      document.querySelectorAll('.pending-badge').forEach(el => {
        el.textContent = this.pendingCount;
        el.style.display = this.pendingCount ? 'inline-flex' : 'none';
      });
    } catch (err) { /* badge is optional */ }
  },

  renderAdminSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">ADMINISTRATOR PANEL</div>
      <a class="nav-item ${this.activeView === 'admin-analytics' ? 'active' : ''}" onclick="App.navigateTo('admin-analytics')">
        <i class="ri-dashboard-line nav-icon"></i>
        <span>Dashboard (8 Cards)</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-company-requests' ? 'active' : ''}" onclick="App.navigateTo('admin-company-requests')">
        <i class="ri-building-2-line nav-icon"></i>
        <span>Company Requests</span>
        <span class="pending-badge" style="display: ${this.pendingCount ? 'inline-flex' : 'none'};">${this.pendingCount}</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-students' ? 'active' : ''}" onclick="App.navigateTo('admin-students')">
        <i class="ri-user-search-line nav-icon"></i>
        <span>Student Management</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-drives' ? 'active' : ''}" onclick="App.navigateTo('admin-drives')">
        <i class="ri-briefcase-4-line nav-icon"></i>
        <span>Placement Drives</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-applications' ? 'active' : ''}" onclick="App.navigateTo('admin-applications')">
        <i class="ri-git-commit-line nav-icon"></i>
        <span>Applications & Pipeline</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-interviews' ? 'active' : ''}" onclick="App.navigateTo('admin-interviews')">
        <i class="ri-calendar-event-line nav-icon"></i>
        <span>Interviews Schedule</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-placements' ? 'active' : ''}" onclick="App.navigateTo('admin-placements')">
        <i class="ri-trophy-line nav-icon"></i>
        <span>Placement Ledger</span>
      </a>
      <div class="nav-section-title">DEVOPS & TOOLS</div>
      <a class="nav-item ${this.activeView === 'admin-monitor' ? 'active' : ''}" onclick="App.navigateTo('admin-monitor')">
        <i class="ri-pulse-line nav-icon"></i>
        <span>DevOps Monitor</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-api' ? 'active' : ''}" onclick="App.navigateTo('admin-api')">
        <i class="ri-code-box-line nav-icon"></i>
        <span>API Explorer</span>
      </a>
    `;
  },

  renderTpoSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">PLACEMENT OFFICER (TPO)</div>
      <a class="nav-item ${this.activeView === 'tpo-dashboard' ? 'active' : ''}" onclick="App.navigateTo('tpo-dashboard')">
        <i class="ri-line-chart-line nav-icon"></i>
        <span>TPO Analytics</span>
      </a>
      <a class="nav-item ${this.activeView === 'tpo-company-requests' ? 'active' : ''}" onclick="App.navigateTo('tpo-company-requests')">
        <i class="ri-building-2-line nav-icon"></i>
        <span>Company Requests</span>
        <span class="pending-badge" style="display: ${this.pendingCount ? 'inline-flex' : 'none'};">${this.pendingCount}</span>
      </a>
      <a class="nav-item ${this.activeView === 'tpo-companies' ? 'active' : ''}" onclick="App.navigateTo('tpo-companies')">
        <i class="ri-building-line nav-icon"></i>
        <span>Visiting Companies</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-students' ? 'active' : ''}" onclick="App.navigateTo('admin-students')">
        <i class="ri-group-line nav-icon"></i>
        <span>Students Verification</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-drives' ? 'active' : ''}" onclick="App.navigateTo('admin-drives')">
        <i class="ri-task-line nav-icon"></i>
        <span>Drives Approvals</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-interviews' ? 'active' : ''}" onclick="App.navigateTo('admin-interviews')">
        <i class="ri-time-line nav-icon"></i>
        <span>Interview Logistics</span>
      </a>
    `;
  },

  renderRecruiterSidebar(companyId) {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">RECRUITER PORTAL</div>
      <a class="nav-item ${this.activeView === 'recruiter-dashboard' ? 'active' : ''}" onclick="App.navigateTo('recruiter-dashboard', { companyId: '${companyId}' })">
        <i class="ri-layout-grid-line nav-icon"></i>
        <span>Recruiter Desk</span>
      </a>
      <a class="nav-item ${this.activeView === 'recruiter-applicants' ? 'active' : ''}" onclick="App.navigateTo('recruiter-applicants')">
        <i class="ri-file-user-line nav-icon"></i>
        <span>View Applicants</span>
      </a>
    `;
  },

  renderStudentSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">STUDENT CANDIDATE</div>
      <a class="nav-item ${this.activeView === 'student-overview' ? 'active' : ''}" onclick="App.navigateTo('student-overview')">
        <i class="ri-user-smile-line nav-icon"></i>
        <span>My Dashboard</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-drives' ? 'active' : ''}" onclick="App.navigateTo('student-drives')">
        <i class="ri-briefcase-line nav-icon"></i>
        <span>Available Drives</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-tracker' ? 'active' : ''}" onclick="App.navigateTo('student-tracker')">
        <i class="ri-route-line nav-icon"></i>
        <span>My Applications</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-interviews' ? 'active' : ''}" onclick="App.navigateTo('student-interviews')">
        <i class="ri-calendar-check-line nav-icon"></i>
        <span>Interview Schedule</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-profile' ? 'active' : ''}" onclick="App.navigateTo('student-profile')">
        <i class="ri-file-text-line nav-icon"></i>
        <span>Profile & Resume</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-offers' ? 'active' : ''}" onclick="App.navigateTo('student-offers')">
        <i class="ri-shake-hands-line nav-icon"></i>
        <span>Placement Status</span>
      </a>
    `;
  },

  navigateTo(viewName, params = {}) {
    if (typeof DevOpsPortal !== 'undefined') DevOpsPortal.stopPolling();
    this.activeView = viewName;
    this.viewParams = params;

    // Refresh Sidebar highlight
    if (this.activeRole === 'admin') this.renderAdminSidebar();
    else if (this.activeRole === 'tpo') this.renderTpoSidebar();
    else if (this.activeRole === 'recruiter') this.renderRecruiterSidebar(this.companyId);
    else this.renderStudentSidebar();

    // Render View
    switch (viewName) {
      // Admin Views
      case 'admin-analytics':
        AdminPortal.renderAnalyticsView();
        break;
      case 'admin-students':
        AdminPortal.renderStudentsView();
        break;
      case 'admin-drives':
        AdminPortal.renderDrivesView();
        break;
      case 'admin-applications':
        AdminPortal.renderApplicationsView(params);
        break;
      case 'admin-interviews':
        AdminPortal.renderInterviewsView();
        break;
      case 'admin-placements':
        AdminPortal.renderPlacementsView();
        break;
      case 'admin-monitor':
        DevOpsPortal.renderMonitorView();
        break;
      case 'admin-api':
        DevOpsPortal.renderApiExplorerView();
        break;

      // TPO Views
      case 'tpo-dashboard':
        TpoPortal.renderDashboardView();
        break;
      case 'tpo-companies':
        TpoPortal.renderCompaniesView();
        break;
      case 'admin-company-requests':
      case 'tpo-company-requests':
        CompanyRequests.render();
        break;

      // Recruiter Views
      case 'recruiter-dashboard':
        RecruiterPortal.renderDashboardView(params.companyId || this.companyId);
        break;
      case 'recruiter-applicants':
        RecruiterPortal.renderApplicantsView(params);
        break;

      // Student Views
      case 'student-overview':
        StudentPortal.renderOverviewView(this.activeRole);
        break;
      case 'student-drives':
        StudentPortal.renderDrivesExplorerView(this.activeRole);
        break;
      case 'student-tracker':
        StudentPortal.renderApplicationsTrackerView(this.activeRole);
        break;
      case 'student-interviews':
        StudentPortal.renderInterviewScheduleView(this.activeRole);
        break;
      case 'student-profile':
        StudentPortal.renderProfileView(this.activeRole);
        break;
      case 'student-offers':
        StudentPortal.renderOffersView(this.activeRole);
        break;

      default:
        console.warn('Unknown view:', viewName);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
