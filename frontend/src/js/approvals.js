/* Company registration requests - shared screen for Admin and TPO */

const CompanyRequests = {
  filter: 'Pending Approval',

  esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  async render(filter) {
    if (filter) this.filter = filter;
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading company requests...</div>`;

    try {
      const all = await API.getCompanyRequests('all');
      const counts = {
        'Pending Approval': all.filter(c => c.status === 'Pending Approval').length,
        'Approved Partner': all.filter(c => c.status === 'Approved Partner').length,
        'Rejected': all.filter(c => c.status === 'Rejected').length
      };
      App.pendingCount = counts['Pending Approval'];
      document.querySelectorAll('.pending-badge').forEach(el => {
        el.textContent = App.pendingCount;
        el.style.display = App.pendingCount ? 'inline-flex' : 'none';
      });

      const list = all.filter(c => c.status === this.filter);
      const tab = (key, label) => `
        <button class="req-tab ${this.filter === key ? 'active' : ''}" onclick="CompanyRequests.render('${key}')">
          ${label} <span class="req-count">${counts[key]}</span>
        </button>`;

      const cards = list.map(c => `
        <div class="drive-card req-card">
          <div class="drive-header">
            <div class="company-title">
              <h4>${this.esc(c.name)}</h4>
              <p>${this.esc(c.sector)} &bull; ${this.esc(c.location)}</p>
            </div>
            ${c.status === 'Pending Approval' ? '<span class="badge badge-inprogress">Pending</span>'
              : c.status === 'Approved Partner' ? '<span class="badge badge-active">Approved</span>'
              : '<span class="badge badge-closed">Rejected</span>'}
          </div>
          <div class="drive-requirements">
            <div class="req-item"><i class="ri-user-2-line"></i> HR: ${this.esc(c.hrName)}</div>
            <div class="req-item"><i class="ri-mail-line"></i> ${this.esc(c.hrEmail)}</div>
            <div class="req-item"><i class="ri-phone-line"></i> ${this.esc(c.hrPhone)}</div>
            <div class="req-item"><i class="ri-global-line"></i> <a href="${this.esc(c.website)}" target="_blank" rel="noopener" style="color: var(--primary);">${this.esc(c.website)}</a></div>
            ${c.requestedAt ? `<div class="req-item"><i class="ri-calendar-line"></i> Requested ${new Date(c.requestedAt).toLocaleDateString()}</div>` : ''}
            ${c.reviewedBy ? `<div class="req-item"><i class="ri-user-follow-line"></i> Reviewed by ${this.esc(c.reviewedBy)}</div>` : ''}
            ${c.status === 'Rejected' && c.rejectionReason ? `<div class="req-item" style="color: var(--danger);"><i class="ri-error-warning-line"></i> ${this.esc(c.rejectionReason)}</div>` : ''}
          </div>
          <div class="req-actions">
            ${c.status !== 'Approved Partner' ? `<button class="btn btn-primary btn-sm" onclick="CompanyRequests.approve('${c.id}', '${this.esc(c.name).replace(/'/g, '')}')"><i class="ri-check-line"></i> Approve</button>` : ''}
            ${c.status === 'Pending Approval' ? `<button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="CompanyRequests.openReject('${c.id}', '${this.esc(c.name).replace(/'/g, '')}')"><i class="ri-close-line"></i> Reject</button>` : ''}
          </div>
        </div>`).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Company Registration Requests</h2>
            <p>Companies register on their own. Review each request - only approved companies can sign in and post drives.</p>
          </div>
        </div>
        <div class="req-tabs">
          ${tab('Pending Approval', 'Pending')}
          ${tab('Approved Partner', 'Approved')}
          ${tab('Rejected', 'Rejected')}
        </div>
        ${list.length ? `<div class="drives-grid">${cards}</div>` : `
          <div class="panel-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="ri-inbox-line" style="font-size: 2.4rem;"></i>
            <p style="margin-top: 10px;">No ${this.filter === 'Pending Approval' ? 'pending' : this.filter === 'Approved Partner' ? 'approved' : 'rejected'} company requests.</p>
          </div>`}
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load company requests: ${this.esc(err.message)}</div>`;
    }
  },

  async approve(id, name) {
    try {
      await API.reviewCompany(id, 'approve');
      showToast(`${name} approved. They can sign in now.`, 'success');
      this.render();
    } catch (err) { showToast(err.message, 'error'); }
  },

  openReject(id, name) {
    openModal(`Reject ${name}?`, `
      <form onsubmit="CompanyRequests.reject(event, '${id}')">
        <div class="form-group">
          <label>Reason (shown to the company)</label>
          <input type="text" id="rejectReason" class="form-control" placeholder="e.g. Could not verify company details" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="background: var(--danger);">Reject request</button>
        </div>
      </form>`);
  },

  async reject(e, id) {
    e.preventDefault();
    try {
      await API.reviewCompany(id, 'reject', document.getElementById('rejectReason').value);
      closeModal();
      showToast('Request rejected.', 'info');
      this.render();
    } catch (err) { showToast(err.message, 'error'); }
  }
};
