/* Student Portal Logic & Views */

const StudentPortal = {
  // 1. STUDENT OVERVIEW DASHBOARD
  async renderOverviewView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Candidate Portal...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const drives = await API.getDrives();
      const applications = await API.getApplications({ studentId: currentStudent.id });
      const notifications = await API.getNotifications({ target: currentStudent.id });

      const eligibleDrivesCount = drives.filter(d => d.status === 'Active' && currentStudent.cgpa >= d.minCgpa && currentStudent.backlogs <= d.maxBacklogs).length;

      let myAppsListHtml = !applications.length ? `<p style="color: var(--text-muted); font-size: 0.9rem;">You have not applied to any recruitment drives yet. Explore active drives to get started!</p>` : applications.map(app => `
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="color: #fff;">${app.company}</h4>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${app.role}</span>
            </div>
            ${renderStatusBadge(app.status)}
          </div>
          <div style="margin-top: 10px;">
            ${renderApplicationTimeline(app.history, app.currentStage)}
          </div>
        </div>
      `).join('');

      let recentNoticesHtml = notifications.slice(0, 3).map(n => `
        <div style="border-left: 3px solid var(--primary); padding-left: 12px; margin-bottom: 14px;">
          <strong style="color: #fff; font-size: 0.9rem;">${n.title}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${n.date}</div>
          <p style="font-size: 0.825rem; color: var(--text-dim); margin-top: 4px;">${n.message}</p>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Welcome back, ${currentStudent.name}!</h2>
            <p>${currentStudent.branch} • Class of ${currentStudent.graduationYear} • Roll: ${currentStudent.id}</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigateTo('student-drives')">
            <i class="ri-search-line"></i> Browse Job Drives
          </button>
        </div>

        <div class="metrics-grid">
          ${renderMetricCard('Academic CGPA', currentStudent.cgpa, `Backlogs: ${currentStudent.backlogs}`, 'ri-award-line', 'icon-cyan')}
          ${renderMetricCard('Placement Status', currentStudent.status, currentStudent.status === 'Placed' ? `Package: ${currentStudent.offerPackage}` : 'Active Candidate', 'ri-user-star-line', currentStudent.status === 'Placed' ? 'icon-emerald' : 'icon-amber')}
          ${renderMetricCard('Eligible Drives', eligibleDrivesCount, 'Matching CGPA & Branch', 'ri-checkbox-circle-line', 'icon-indigo')}
          ${renderMetricCard('My Applications', applications.length, 'Submitted Drives', 'ri-send-plane-line', 'icon-purple')}
        </div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-route-line" style="color: var(--primary);"></i> My Application Tracker</h3>
            </div>
            <div>
              ${myAppsListHtml}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-notification-3-line" style="color: var(--secondary);"></i> Notifications & Alerts</h3>
            </div>
            <div>
              ${recentNoticesHtml || '<p style="color: var(--text-muted);">No new alerts.</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load candidate overview: ${err.message}</div>`;
    }
  },

  // 2. BROWSE JOB DRIVES VIEW
  async renderDrivesExplorerView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Drives...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const drives = await API.getDrives();
      const myApps = await API.getApplications({ studentId: currentStudent.id });

      let drivesCardsHtml = drives.map(d => {
        const appliedApp = myApps.find(a => a.driveId === d.id);
        const isEligibleCgpa = currentStudent.cgpa >= d.minCgpa;
        const isEligibleBacklog = currentStudent.backlogs <= d.maxBacklogs;
        const isEligible = isEligibleCgpa && isEligibleBacklog;

        let actionBtnHtml = '';
        if (appliedApp) {
          actionBtnHtml = `<span class="badge badge-inprogress"><i class="ri-check-double-line"></i> Applied (${appliedApp.status})</span>`;
        } else if (d.status === 'Closed') {
          actionBtnHtml = `<span class="badge badge-closed">Drive Closed</span>`;
        } else if (!isEligible) {
          actionBtnHtml = `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5;">
            <i class="ri-close-circle-line"></i> Not Eligible (Min CGPA ${d.minCgpa})
          </button>`;
        } else {
          actionBtnHtml = `<button class="btn btn-primary btn-sm" onclick="StudentPortal.handleApply('${currentStudent.id}', '${d.id}')">
            <i class="ri-send-plane-fill"></i> 1-Click Apply
          </button>`;
        }

        return `
          <div class="drive-card">
            <div class="drive-header">
              <div class="company-title">
                <h4>${d.company}</h4>
                <p>${d.role}</p>
              </div>
              <div class="ctc-badge">${d.ctc}</div>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
              ${d.description}
            </p>

            <div class="drive-requirements">
              <div class="req-item"><i class="ri-map-pin-line"></i> <span>Location: ${d.location}</span></div>
              <div class="req-item"><i class="ri-award-line"></i> <span>Min CGPA: <strong>${d.minCgpa}</strong> (Your CGPA: <strong>${currentStudent.cgpa}</strong>)</span></div>
              <div class="req-item"><i class="ri-calendar-event-line"></i> <span>Deadline: ${d.deadline}</span></div>
            </div>

            <div class="drive-tags">
              ${d.eligibleBranches.map(b => `<span class="drive-tag">${b}</span>`).join('')}
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; pt: 12px; border-top: 1px solid var(--border-color);">
              ${isEligible ? '<span class="badge badge-placed"><i class="ri-shield-check-line"></i> Eligible</span>' : '<span class="badge badge-unplaced"><i class="ri-error-warning-line"></i> Ineligible</span>'}
              <div>
                ${actionBtnHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Campus Placement Drives Directory</h2>
            <p>Explore active recruitment drives. Live eligibility checks are computed based on your CGPA (${currentStudent.cgpa}).</p>
          </div>
        </div>

        <div class="drives-grid">
          ${drivesCardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load job drives: ${err.message}</div>`;
    }
  },

  async handleApply(studentId, driveId) {
    try {
      await API.applyToDrive(studentId, driveId);
      showToast('Application submitted successfully!', 'success');
      this.renderDrivesExplorerView(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 3. STUDENT INTERVIEW SCHEDULE VIEW
  async renderInterviewScheduleView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Interview Schedule...</div>`;

    try {
      const interviews = await API.getInterviews({ studentId });

      let listHtml = !interviews.length ? `
        <div class="panel-card" style="text-align: center; padding: 40px;">
          <i class="ri-calendar-event-line" style="font-size: 3.5rem; color: var(--text-dim);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Upcoming Interviews Scheduled</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">When recruiters shortlist your application, interview invitations will appear here.</p>
        </div>
      ` : interviews.map(i => `
        <div class="panel-card" style="margin-bottom: 20px; border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700; text-transform: uppercase;">${i.company} RECRUITMENT</span>
              <h3 style="color: #fff; margin-top: 4px;">${i.roundName}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">Evaluator: ${i.interviewer}</p>
            </div>
            ${renderStatusBadge(i.status)}
          </div>

          <div style="margin-top: 16px; padding: 14px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; color: #fff; font-weight: 600;">
                <i class="ri-calendar-line" style="color: var(--primary);"></i> ${i.date}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                <i class="ri-time-line" style="color: var(--secondary);"></i> ${i.time}
              </div>
            </div>
            <a href="${i.meetingLink}" target="_blank" class="btn btn-primary">
              <i class="ri-video-chat-fill"></i> Join Virtual Interview Room
            </a>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>My Interview Schedule</h2>
            <p>View confirmed technical & HR interview slots with virtual video room links.</p>
          </div>
        </div>

        <div>
          ${listHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load interviews: ${err.message}</div>`;
    }
  },

  // 4. PERSONAL & EDUCATION PROFILE VIEW
  async renderProfileView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Student Profile...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Personal & Education Profile</h2>
            <p>Manage your academic percentage scores, skill tags, and verified resume document.</p>
          </div>
        </div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-user-settings-line" style="color: var(--primary);"></i> Academic & Personal Credentials</h3>
            </div>
            <form onsubmit="StudentPortal.handleSaveProfile(event, '${currentStudent.id}')">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" value="${currentStudent.name}" disabled>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Student Roll / ID</label>
                  <input type="text" class="form-control" value="${currentStudent.id}" disabled>
                </div>
                <div>
                  <label>Branch</label>
                  <input type="text" class="form-control" value="${currentStudent.branch}" disabled>
                </div>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Class 10th Score (%)</label>
                  <input type="number" step="0.1" class="form-control" value="${currentStudent.class10Pct || 92.0}" disabled>
                </div>
                <div>
                  <label>Class 12th / Diploma Score (%)</label>
                  <input type="number" step="0.1" class="form-control" value="${currentStudent.class12Pct || 90.0}" disabled>
                </div>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Current CGPA</label>
                  <input type="number" step="0.01" class="form-control" value="${currentStudent.cgpa}" disabled>
                </div>
                <div>
                  <label>Active Backlogs</label>
                  <input type="number" class="form-control" value="${currentStudent.backlogs}" disabled>
                </div>
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" id="profPhone" class="form-control" value="${currentStudent.phone || ''}">
              </div>
              <div class="form-group">
                <label>Skill Tags (Comma Separated)</label>
                <input type="text" id="profSkills" class="form-control" value="${(currentStudent.skills || []).join(', ')}">
              </div>
              <div class="form-group">
                <label>Resume PDF Document URL</label>
                <input type="url" id="profResume" class="form-control" value="${currentStudent.resumeUrl || ''}">
              </div>
              <div style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">
                  <i class="ri-save-line"></i> Save Profile Details
                </button>
              </div>
            </form>
          </div>

          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-file-pdf-line" style="color: var(--secondary);"></i> Resume Verification Card</h3>
            </div>
            <div style="text-align: center; padding: 24px; border: 1px dashed var(--border-glow); border-radius: var(--radius-md);">
              <i class="ri-file-text-fill" style="font-size: 3.5rem; color: var(--primary);"></i>
              <h4 style="margin-top: 12px; color: #fff;">${currentStudent.name}_Resume.pdf</h4>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Verified by Training & Placement Cell</p>
              <div style="margin-top: 18px;">
                <a href="${currentStudent.resumeUrl}" target="_blank" class="btn btn-secondary btn-sm">
                  <i class="ri-external-link-line"></i> Preview Resume Document
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load profile: ${err.message}</div>`;
    }
  },

  async handleSaveProfile(e, studentId) {
    e.preventDefault();
    const updateData = {
      phone: document.getElementById('profPhone').value,
      skills: document.getElementById('profSkills').value.split(',').map(s => s.trim()),
      resumeUrl: document.getElementById('profResume').value
    };

    try {
      await API.updateStudent(studentId, updateData);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 5. OFFERS & DECISION DESK VIEW
  async renderOffersView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Offers...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const applications = await API.getApplications({ studentId: currentStudent.id });

      const offerApps = applications.filter(a => a.status === 'Offer Accepted' || a.status === 'Selected' || a.currentStage === 'Offer Letter');

      let cardsHtml = !offerApps.length ? `
        <div class="panel-card" style="text-align: center; padding: 40px;">
          <i class="ri-shake-hands-line" style="font-size: 3.5rem; color: var(--text-dim);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Job Offers Issued Yet</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Once you complete technical & HR interviews, your offer letters will appear here.</p>
        </div>
      ` : offerApps.map(a => `
        <div class="panel-card" style="border-left: 4px solid var(--success); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; color: var(--success); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">OFFICIAL SELECTION</span>
              <h3 style="color: #fff; font-size: 1.5rem; margin-top: 4px;">${a.company}</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem;">${a.role}</p>
            </div>
            <div class="ctc-badge">${currentStudent.offerPackage !== '-' ? currentStudent.offerPackage : '₹24.0 LPA'}</div>
          </div>

          <p style="margin: 16px 0; font-size: 0.875rem; color: var(--text-main);">
            Congratulations ${currentStudent.name}! The Training & Placement Cell has released your official job offer letter for <strong>${a.company}</strong>.
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; pt: 16px; border-top: 1px solid var(--border-color);">
            ${renderStatusBadge(a.status)}
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-primary" onclick="showToast('Offer Acceptance confirmed! TPO notified.', 'success')">
                <i class="ri-check-line"></i> Accept Offer
              </button>
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Offers & Placement Decision Desk</h2>
            <p>Review issued offer letters and formalize offer acceptance according to campus policy.</p>
          </div>
        </div>

        <div>
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load offers: ${err.message}</div>`;
    }
  }
};
