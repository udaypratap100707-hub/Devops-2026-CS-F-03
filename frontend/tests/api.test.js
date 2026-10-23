// Integration tests: boots the real Express app on a random port with a throw-away data file.
process.env.NODE_ENV = 'test';
process.env.AUTH_RATE_LIMIT = '6';
const os = require('os');
const fs = require('fs');
const path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'placement-'));
process.env.DATA_FILE = path.join(tmp, 'store.json');

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server, base;
test.before(async () => {
  await new Promise(res => { server = app.listen(0, res); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

const post = (url, body) => fetch(base + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('GET /api/health returns ok', async () => {
  const res = await fetch(base + '/api/health');
  assert.strictEqual(res.status, 200);
  const j = await res.json();
  assert.strictEqual(j.status, 'ok');
  assert.ok(typeof j.uptimeSeconds === 'number');
});

test('GET /api/version exposes name and version', async () => {
  const j = await (await fetch(base + '/api/version')).json();
  assert.strictEqual(j.name, 'student-placement-system');
  assert.match(j.version, /^\d+\.\d+\.\d+$/);
});

test('security headers are present and x-powered-by is hidden', async () => {
  const res = await fetch(base + '/api/health');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('x-powered-by'), null);
});

test('GET /api/docs lists the endpoints', async () => {
  const docs = await (await fetch(base + '/api/docs')).json();
  assert.ok(Array.isArray(docs) && docs.length > 10);
  assert.ok(docs.some(d => d.path === '/api/health'));
});

test('unknown API route returns JSON 404', async () => {
  const res = await fetch(base + '/api/does-not-exist');
  assert.strictEqual(res.status, 404);
  assert.ok((await res.json()).error);
});

test('register then login works', async () => {
  const reg = await post('/api/auth/register', { name: 'Test Student', email: 'test@campus.edu', password: 'pass123', role: 'student' });
  assert.strictEqual(reg.status, 201);
  const login = await post('/api/auth/login', { email: 'test@campus.edu', password: 'pass123' });
  assert.strictEqual(login.status, 200);
  assert.strictEqual((await login.json()).user.role, 'student');
});

test('wrong password is rejected with 401', async () => {
  const res = await post('/api/auth/login', { email: 'test@campus.edu', password: 'nope' });
  assert.strictEqual(res.status, 401);
});

test('metrics count requests and show up in logs', async () => {
  const m = await (await fetch(base + '/api/metrics')).json();
  assert.ok(m.requests.total >= 3);
  assert.ok(m.memory.rssMB > 0);
  const logs = await (await fetch(base + '/api/logs')).json();
  assert.ok(logs.some(l => l.path === '/api/auth/login'));
});

test('prometheus endpoint exposes text metrics', async () => {
  const text = await (await fetch(base + '/api/metrics/prometheus')).text();
  assert.match(text, /placement_uptime_seconds/);
});

test('auth endpoints are rate limited (429)', async () => {
  let last;
  for (let i = 0; i < 10; i++) last = await post('/api/auth/login', { email: 'x@y.z', password: 'bad' });
  assert.strictEqual(last.status, 429);
});
