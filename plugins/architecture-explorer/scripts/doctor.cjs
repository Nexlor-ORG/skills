#!/usr/bin/env node
// Setup check for the Architecture Explorer plugin.
//   node doctor.cjs
// Confirms the tools the plugin relies on are present and that the whole pipeline works on the sample map.
// It writes only to a temporary folder, which it removes, and makes no network requests.
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { TEMPLATE, pageStyle } = require('./lib.cjs');

const root = path.join(__dirname, '..');
const rows = [];
const row = (state, name, note) => rows.push([state, name, note || '']);
const run = (script, args) => cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { encoding: 'utf8' });
const lastLine = r => ((r.stdout || '') + (r.stderr || '')).trim().split('\n').pop() || '';

// 1. Node
const major = +process.versions.node.split('.')[0];
row(major >= 18 ? 'ok' : 'fail', 'Node.js 18 or newer', 'found ' + process.versions.node + (major >= 18 ? '' : '; install a newer Node.js'));

// 2. Template
let template = '';
try { template = fs.readFileSync(TEMPLATE, 'utf8'); } catch (e) { /* reported below */ }
const marks = ['__TITLE__', '__ARCH_JSON__', '/*DATA*/', '/*END*/'].filter(m => template.split(m).length !== 2);
row(template && !marks.length ? 'ok' : 'fail', 'Explorer template', template ? (marks.length ? 'missing markers: ' + marks.join(', ') : Buffer.byteLength(template) + ' bytes') : 'template/explorer.html not found');
const outside = template.match(/(src|href)\s*=\s*["']https?:[^"']+|url\(\s*["']?https?:|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|import\s*\(/g);
row(!outside ? 'ok' : 'fail', 'Template makes no network requests', outside ? outside.join(' | ') : 'only claude.use("sample") reaches outside the page');

// 3. Design tokens match the template
try {
  const tokens = JSON.parse(fs.readFileSync(path.join(root, 'design-system', 'tokens.json'), 'utf8'));
  const css = pageStyle(template);
  const block = (start) => { const i = css.indexOf(start); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  const read = text => Object.fromEntries([...text.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  const dark = read(block(':root{')), light = read(block(':root[data-theme="light"]{'));
  const drift = [];
  for (const [name, t] of Object.entries(tokens.color)) {
    if (dark[name] !== t.dark) drift.push(name + ' dark');
    if (light[name] !== t.light) drift.push(name + ' light');
  }
  row(drift.length ? 'fail' : 'ok', 'Design tokens match the template', drift.length ? 'out of step: ' + drift.slice(0, 8).join(', ') : Object.keys(tokens.color).length + ' colour tokens, dark and light');
} catch (e) { row('fail', 'Design tokens match the template', e.message); }

// 4. Pipeline on the sample map
const sample = path.join(root, 'examples', 'lumen-desk', 'architecture.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'architecture-explorer-'));
const page = path.join(tmp, 'explorer.html'), back = path.join(tmp, 'roundtrip.json');
try {
  let r = run('validate.cjs', [sample]);
  row(r.status === 0 ? 'ok' : 'fail', 'Validate the sample map', lastLine(r));
  r = run('build.cjs', [sample, page]);
  row(r.status === 0 ? 'ok' : 'fail', 'Build the sample page', lastLine(r).replace(tmp + path.sep, ''));
  r = run('smoke.cjs', [page]);
  row(r.status === 0 ? 'ok' : 'fail', 'Smoke-test the sample page', lastLine(r).slice(0, 110));
  r = run('extract.cjs', [page, back]);
  row(r.status === 0 ? 'ok' : 'fail', 'Read data back out of a built page', lastLine(r).replace(tmp + path.sep, ''));
  r = run('snapshot.cjs', [page, path.join(tmp, 'shots')]);
  row(r.status === 0 ? 'ok' : 'fail', 'Write still pictures of the canvases', lastLine(r).split(':')[0].replace(tmp + path.sep, ''));
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

// 5. Optional: picture rendering
const ql = process.platform === 'darwin' && cp.spawnSync('which', ['qlmanage']).status === 0;
row(ql ? 'ok' : 'skip', 'Render pictures as PNG (optional)', ql ? 'macOS Quick Look found' : 'not available here; open the .svg stills in a browser instead');

const mark = { ok: 'OK  ', fail: 'FAIL', skip: 'SKIP' };
console.log(rows.map(([s, n, note]) => mark[s] + '  ' + n + (note ? '  -  ' + note : '')).join('\n'));
const failed = rows.filter(r => r[0] === 'fail').length;
console.log(failed ? '\n' + failed + ' check(s) failed. The plugin is not ready.' : '\nReady. Publishing and the Ask Claude chat depend on the app you run Claude in; see the explorer-setup skill.');
process.exit(failed ? 1 : 0);
