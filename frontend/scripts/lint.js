// Zero-dependency "lint": syntax-checks every .js file (server, tests, frontend scripts).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = ['server.js', 'test.js', 'scripts', 'tests', 'src/js'];
const files = [];
roots.forEach(r => { const w = (p) => { if (!fs.existsSync(p)) return; if (fs.statSync(p).isDirectory()) fs.readdirSync(p).forEach(f => w(path.join(p, f))); else if (p.endsWith('.js')) files.push(p); }; w(r); });

let failed = 0;
for (const f of [...new Set(files)]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); console.log('OK   ' + f); }
  catch (e) { failed++; console.error('FAIL ' + f + '\n' + e.stderr.toString()); }
}
console.log(failed ? `\n${failed} file(s) failed` : '\nAll files passed syntax check');
process.exit(failed ? 1 : 0);
