/* DevOps Monitor + API Explorer (Admin tools) */

const DevOpsPortal = {
  timer: null,
  autoRefresh: true,

  stopPolling() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  esc(v) {
    return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  fmtUptime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
  },

  // ---------------------------------------------------------------
  // 1. LIVE MONITOR
  // ---------------------------------------------------------------
  async renderMonitorView() {
    this.stopPolling();
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>DevOps Monitor</h2>
          <p>Live health, metrics and request logs straight from the running server.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-secondary" id="monToggle"><i class="ri-refresh-line"></i> Auto-refresh: <span id="monToggleState">ON</span></button>
          <button class="btn btn-primary" id="monExport"><i class="ri-download-2-line"></i> Export Logs CSV</button>
        </div>
      </div>
      <div id="monBody"><div class="loading-state"><i class="ri-loader-4-line ri-spin"></i> Connecting to server...</div></div>
    `;

    document.getElementById('monToggle').onclick = () => {
      this.autoRefresh = !this.autoRefresh;
      document.getElementById('monToggleState').textContent = this.autoRefresh ? 'ON' : 'OFF';
    };
    document.getElementById('monExport').onclick = () => this.exportLogsCsv();

    await this.refreshMonitor();
    this.timer = setInterval(() => { if (this.autoRefresh) this.refreshMonitor(); }, 5000);
  },

  async refreshMonitor() {
    const body = document.getElementById('monBody');
    if (!body) { this.stopPolling(); return; }

    try {
      const t0 = performance.now();
      const [health, version, m, logs] = await Promise.all([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/version').then(r => r.json()),
        fetch('/api/metrics').then(r => r.json()),
        fetch('/api/logs').then(r => r.json())
      ]);
      const ping = Math.round(performance.now() - t0);
      this.lastLogs = logs;

      const ok = health.status === 'ok';
      const cards = [
        renderMetricCard('Server Status', ok ? 'HEALTHY' : 'DOWN', `Ping ${ping} ms`, 'ri-heart-pulse-line', ok ? 'icon-emerald' : 'icon-amber'),
        renderMetricCard('Uptime', this.fmtUptime(health.uptimeSeconds), `Since ${new Date(version.startedAt).toLocaleTimeString()}`, 'ri-time-line', 'icon-indigo'),
        renderMetricCard('API Requests', m.requests.total, `Avg ${m.requests.avgLatencyMs} ms`, 'ri-exchange-line', 'icon-cyan'),
        renderMetricCard('Memory (RSS)', `${m.memory.rssMB} MB`, `Heap ${m.memory.heapUsedMB}/${m.memory.heapTotalMB} MB`, 'ri-cpu-line', 'icon-purple'),
        renderMetricCard('App Version', `v${this.esc(version.version)}`, `Commit: ${this.esc(version.commit)}`, 'ri-git-branch-line', 'icon-indigo'),
        renderMetricCard('Runtime', this.esc(version.node), `${this.esc(version.environment)} • ${m.system.cpus} CPU`, 'ri-nodejs-line', 'icon-emerald'),
        renderMetricCard('Data Store', health.dataStore === 'available' ? 'Connected' : 'Missing', 'data/store.json', 'ri-database-2-line', health.dataStore === 'available' ? 'icon-cyan' : 'icon-amber'),
        renderMetricCard('Load Average', m.system.loadAvg[0], `5m: ${m.system.loadAvg[1]} • 15m: ${m.system.loadAvg[2]}`, 'ri-speed-line', 'icon-amber')
      ].join('');

      const statuses = Object.entries(m.requests.byStatus).sort();
      const totalReq = m.requests.total || 1;
      const statusBars = statuses.length ? statuses.map(([code, n]) => `
        <div class="chart-bar-item">
          <div class="chart-label"><span>HTTP ${code}</span><bold>${n} requests</bold></div>
          <div class="chart-track"><div class="chart-fill ${code.startsWith('2') ? '' : 'chart-fill-warn'}" style="width:${Math.round((n / totalReq) * 100)}%"></div></div>
        </div>`).join('') : '<p style="color: var(--text-muted);">No API traffic yet - click around the portal and watch this update.</p>';

      const stages = [
        ['ri-git-commit-line', 'Commit', 'git push'],
        ['ri-code-s-slash-line', 'Lint', 'node --check'],
        ['ri-test-tube-line', 'Test', 'npm test'],
        ['ri-box-3-line', 'Docker Build', 'Dockerfile'],
        ['ri-upload-cloud-2-line', 'Publish', 'GHCR image'],
        ['ri-rocket-2-line', 'Deploy', 'k8s / compose']
      ].map((s, i) => `
        <div class="pipe-stage"><div class="pipe-icon"><i class="${s[0]}"></i></div><strong>${s[1]}</strong><span>${s[2]}</span></div>
        ${i < 5 ? '<div class="pipe-arrow"><i class="ri-arrow-right-s-line"></i></div>' : ''}`).join('');

      body.innerHTML = `
        <div class="metrics-grid">${cards}</div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title"><h3>CI/CD Pipeline</h3><span class="badge badge-inprogress">.github/workflows/ci.yml</span></div>
            <div class="pipe-row">${stages}</div>
          </div>
          <div class="panel-card">
            <div class="panel-title"><h3>Responses by Status</h3></div>
            <div class="branch-chart-list">${statusBars}</div>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-title"><h3>Live API Request Log</h3><span class="badge badge-placed"><i class="ri-record-circle-line"></i> last ${logs.length}</span></div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Latency</th></tr></thead>
              <tbody>
                ${logs.length ? logs.slice(0, 15).map(l => `
                  <tr>
                    <td>${new Date(l.time).toLocaleTimeString()}</td>
                    <td><span class="method-pill m-${l.method}">${l.method}</span></td>
                    <td><code>${this.esc(l.path)}</code></td>
                    <td><span class="badge ${l.status < 400 ? 'badge-placed' : l.status < 500 ? 'badge-unplaced' : 'badge-closed'}">${l.status}</span></td>
                    <td>${l.ms} ms</td>
                  </tr>`).join('') : '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No requests logged yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="panel-card"><h3 style="color: var(--danger);"><i class="ri-error-warning-line"></i> Server unreachable</h3><p style="color: var(--text-muted); margin-top:8px;">${this.esc(err.message)}</p></div>`;
    }
  },

  exportLogsCsv() {
    const logs = this.lastLogs || [];
    if (!logs.length) { showToast('No logs to export yet.', 'info'); return; }
    const rows = [['time', 'method', 'path', 'status', 'latency_ms'], ...logs.map(l => [l.time, l.method, l.path, l.status, l.ms])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `api-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Logs exported as CSV.', 'success');
  },

  // ---------------------------------------------------------------
  // 2. API EXPLORER (mini Swagger)
  // ---------------------------------------------------------------
  async renderApiExplorerView() {
    this.stopPolling();
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state"><i class="ri-loader-4-line ri-spin"></i> Loading API catalogue...</div>`;

    try {
      const docs = await fetch('/api/docs').then(r => r.json());
      this.docs = docs;
      const tags = [...new Set(docs.map(d => d.tag))];

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>API Explorer</h2>
            <p>${docs.length} REST endpoints. Try any GET request live, or copy a ready-made cURL command.</p>
          </div>
        </div>
        <div class="filter-bar">
          <div class="search-input-box">
            <i class="ri-search-line search-icon"></i>
            <input type="text" id="apiSearch" placeholder="Filter endpoints (e.g. drives, POST, health)...">
          </div>
          <select class="select-filter" id="apiTag">
            <option value="">All groups</option>
            ${tags.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div id="apiList"></div>
      `;
      const draw = () => this.drawApiList();
      document.getElementById('apiSearch').addEventListener('input', draw);
      document.getElementById('apiTag').addEventListener('change', draw);
      draw();
    } catch (err) {
      container.innerHTML = `<div class="panel-card"><h3 style="color: var(--danger);">Could not load API docs</h3><p style="color: var(--text-muted);">${this.esc(err.message)}</p></div>`;
    }
  },

  drawApiList() {
    const q = document.getElementById('apiSearch').value.toLowerCase();
    const tag = document.getElementById('apiTag').value;
    const list = this.docs.map((d, i) => ({ ...d, i }))
      .filter(d => (!tag || d.tag === tag) && (`${d.method} ${d.path} ${d.desc} ${d.tag}`.toLowerCase().includes(q)));

    document.getElementById('apiList').innerHTML = list.length ? list.map(d => {
      const tryable = d.method === 'GET' && !d.path.includes(':');
      return `
        <div class="panel-card api-row">
          <div class="api-head">
            <span class="method-pill m-${d.method}">${d.method}</span>
            <code class="api-path">${this.esc(d.path)}</code>
            <span class="api-desc">${this.esc(d.desc)}</span>
            <span class="drive-tag">${this.esc(d.tag)}</span>
            <div class="api-actions">
              ${tryable ? `<button class="btn btn-primary btn-sm" onclick="DevOpsPortal.tryEndpoint(${d.i})"><i class="ri-play-fill"></i> Try it</button>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="DevOpsPortal.copyCurl(${d.i})"><i class="ri-terminal-box-line"></i> cURL</button>
            </div>
          </div>
          ${d.body ? `<pre class="api-pre api-body">Example body: ${this.esc(JSON.stringify(d.body, null, 2))}</pre>` : ''}
          <div id="apiOut${d.i}"></div>
        </div>`;
    }).join('') : '<p style="color: var(--text-muted);">No endpoints match your filter.</p>';
  },

  async tryEndpoint(i) {
    const d = this.docs[i];
    const out = document.getElementById(`apiOut${i}`);
    out.innerHTML = `<pre class="api-pre">Calling ${this.esc(d.path)} ...</pre>`;
    const t0 = performance.now();
    try {
      const res = await fetch(d.path);
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { /* plain text (prometheus) */ }
      if (pretty.length > 3000) pretty = pretty.slice(0, 3000) + '\n... (truncated)';
      out.innerHTML = `
        <div class="api-status"><span class="badge ${res.ok ? 'badge-placed' : 'badge-closed'}">${res.status} ${res.statusText}</span> <span style="color: var(--text-muted); font-size: .8rem;">${ms} ms</span></div>
        <pre class="api-pre">${this.esc(pretty)}</pre>`;
    } catch (err) {
      out.innerHTML = `<pre class="api-pre" style="color: var(--danger);">${this.esc(err.message)}</pre>`;
    }
  },

  copyCurl(i) {
    const d = this.docs[i];
    let cmd = `curl -X ${d.method} ${location.origin}${d.path}`;
    if (d.body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(d.body)}'`;
    const done = () => showToast('cURL command copied to clipboard.', 'success');
    if (navigator.clipboard) navigator.clipboard.writeText(cmd).then(done, () => showToast(cmd, 'info'));
    else showToast(cmd, 'info');
  }
};
