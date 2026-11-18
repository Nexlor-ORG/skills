#!/usr/bin/env node
// Checks map data before it is built or published.
//   node validate.cjs <architecture.json | explorer.html> [--repo <repo root>]
// With --repo it also opens (read-only) every source file the map cites and checks the cited line exists.
// Exit code 0: no FAIL lines. WARN lines point at thin coverage and do not block a build.
const fs = require('fs'), path = require('path');
const { readData } = require('./lib.cjs');

const args = process.argv.slice(2);
const ri = args.indexOf('--repo');
const repo = ri >= 0 ? args[ri + 1] : null;
const file = args.find((a, i) => !a.startsWith('--') && (ri < 0 || i !== ri + 1));
if (!file || (ri >= 0 && !repo)) { console.error('usage: node validate.cjs <architecture.json | explorer.html> [--repo <repo root>]'); process.exit(2); }

let A;
try { A = readData(file); } catch (e) { console.error('FAIL cannot read map data: ' + e.message); process.exit(1); }

const out = [];
const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
const bad = (list, m) => ok(list.length === 0, m + (list.length ? ' -> ' + list.slice(0, 12).join(', ') : ''));
const warn = (list, m) => out.push((list.length ? 'WARN ' : 'PASS ') + m + (list.length ? ' -> ' + list.slice(0, 12).join(', ') : ''));
const arr = v => (Array.isArray(v) ? v : []);
const finish = () => {
  console.log(out.join('\n'));
  const fails = out.filter(l => l.startsWith('FAIL')).length, warns = out.filter(l => l.startsWith('WARN')).length;
  console.log(fails ? `\n${fails} check(s) failed` : `\nall checks passed${warns ? ` (${warns} warning(s))` : ''}`);
  process.exit(fails ? 1 : 0);
};

// ---- shape: everything the page reads must be there ----
const shape = [];
const need = (c, m) => { if (!c) shape.push(m); };
need(A.project && A.project.name && A.project.tagline && /^\d{4}-\d{2}-\d{2}$/.test(A.project.date || ''), 'project needs name, tagline and date (YYYY-MM-DD)');
need(A.graph && Array.isArray(A.graph.nodes) && Array.isArray(A.graph.edges), 'graph.nodes and graph.edges must be arrays');
for (const k of ['flows', 'notes', 'roles', 'features', 'featureNotes', 'userJourneys', 'journeyNotes']) need(Array.isArray(A[k]), k + ' must be an array');
need(A.overview && Array.isArray(A.overview.groups) && A.overview.groups.length === 3 && Array.isArray(A.overview.blocks) && Array.isArray(A.overview.links),
  'overview needs exactly 3 groups, plus blocks and links');
if (shape.length) { bad(shape, 'map has every section the page reads'); finish(); }
ok(true, 'map has every section the page reads');

const N = A.graph.nodes, E = A.graph.edges, R = A.roles, F = A.features, J = A.userJourneys, O = A.overview, OB = O.blocks, OL = O.links;
const ids = N.map(n => n.id), set = new Set(ids);
const kinds = ['entry', 'cron', 'agent', 'model', 'tool', 'service', 'store', 'external'];
const edgeKinds = ['calls', 'reads', 'writes', 'triggers'];
const certainty = [undefined, 'confirmed', 'documented', 'inferred'];
const built = [undefined, 'implemented', 'partial'];
const stepTypes = ['action', 'screen', 'decision', 'system', 'ai', 'external', 'success', 'error'];
const icons = ['screen', 'server', 'globe', 'bolt', 'db', 'spark', 'key'];
const pairNotes = a => arr(a).every(x => Array.isArray(x) && x.length === 2 && x[0] && x[1]);

// ---- architecture graph ----
ok(N.length >= 2 && N.length <= 60, `between 2 and 60 components (${N.length})`);
ok(E.length <= 120, `at most 120 relationships (${E.length})`);
bad(ids.filter((k, i, a) => a.indexOf(k) !== i), 'component ids unique');
bad(N.filter(n => !(n.id && n.label && n.sub && n.group && n.sourceRef && n.detail && n.why)).map(n => n.id || '(no id)'), 'components have id, label, sub, group, sourceRef, detail and why');
bad(N.filter(n => !kinds.includes(n.kind)).map(n => n.id + ':' + n.kind), 'component kinds valid');
bad(N.filter(n => !['ai', 'biz', 'both'].includes(n.v)).map(n => n.id + ':' + n.v), 'component view (v) is ai, biz or both');
bad(N.filter(n => !certainty.includes(n.status)).map(n => n.id), 'component status is confirmed, documented or inferred');
ok(N.some(n => n.v === 'biz' || n.v === 'both'), 'at least one component shows in the Business view');
bad(E.filter(e => !set.has(e.from) || !set.has(e.to)).map(e => e.from + '>' + e.to), 'relationships reference existing components');
bad(E.filter(e => !edgeKinds.includes(e.kind) || !e.label || !certainty.includes(e.status)).map(e => e.from + '>' + e.to), 'relationships have a valid kind, a label and a valid status');
bad(E.map(e => e.from + '>' + e.to).filter((k, i, a) => a.indexOf(k) !== i), 'no duplicate relationships');
bad(E.filter(e => e.from === e.to).map(e => e.from), 'no component is related to itself');
const deg = new Set(E.flatMap(e => [e.from, e.to]));
bad(N.filter(n => !deg.has(n.id)).map(n => n.id), 'no unconnected components');
bad(N.filter(n => String(n.label).length > 27 || String(n.sub).length > 33).map(n => n.id), 'labels (27) and sub-labels (33 characters) fit the component card');
bad(A.flows.filter(f => !(f.name && f.desc && arr(f.nodes).length && f.nodes.every(id => set.has(id)))).map(f => f.name || '(unnamed)'), 'traced flows have a name, a description and existing components');
ok(pairNotes(A.notes) && pairNotes(A.featureNotes) && pairNotes(A.journeyNotes), 'scan notes are [heading, text] pairs');

// ---- roles, features, functions ----
const roleIds = new Set(R.map(r => r.id));
const subs = F.flatMap(f => arr(f.subs)), fns = subs.flatMap(s => arr(s.functions));
ok(F.length >= 1 && J.length >= 1 && R.length >= 1, `at least one role, feature and journey (${R.length}, ${F.length}, ${J.length})`);
bad(R.filter(r => !(r.id && r.name && ['role', 'persona'].includes(r.basis) && r.d && r.goals && r.can && r.cannot && r.entry && arr(r.src).length)).map(r => r.id || '(no id)'),
  'roles have id, name, basis (role or persona), d, goals, can, cannot, entry and src');
const fId = new Set(F.map(f => f.id)), fnId = new Set(fns.map(f => f.id));
bad(F.filter(f => !(f.id && f.name && f.d && f.why && f.dom && ['user', 'internal', 'admin'].includes(f.aud) && arr(f.roles).length && arr(f.entry).length && arr(f.src).length && arr(f.subs).length && Array.isArray(f.deps))).map(f => f.id || '(no id)'),
  'features have id, name, d, why, dom, aud, roles, entry, src, deps and at least one capability');
bad(F.flatMap(f => arr(f.roles).filter(r => !roleIds.has(r)).map(r => f.id + ':' + r)), 'feature roles exist');
bad(F.flatMap(f => arr(f.deps).filter(d => !fId.has(d) || d === f.id).map(d => f.id + '>' + d)), 'feature dependencies exist');
bad(subs.filter(s => !(s.id && s.name && s.d && arr(s.functions).length)).map(s => s.id || '(no id)'), 'every capability has id, name, d and a function');
bad(fns.filter(f => !(f.id && f.name && f.d && f.src && arr(f.nodes).length && built.includes(f.status))).map(f => f.id || '(no id)'), 'functions have id, name, d, src, a valid status and at least one component');
bad(fns.flatMap(f => arr(f.nodes).filter(n => !set.has(n)).map(n => f.id + ':' + n)), 'function components exist');
bad(fns.flatMap(f => arr(f.calls).filter(c => !fnId.has(c) || c === f.id).map(c => f.id + '>' + c)), 'function calls exist');
bad(fns.filter(f => f.ai && !(set.has(f.ai) && N.find(n => n.id === f.ai).kind === 'agent' && arr(f.nodes).includes(f.ai))).map(f => f.id), 'a function\'s ai field names an agent that is also among its components');

// ---- journeys ----
bad(J.filter(j => !(j.id && j.name && j.dom && j.outcome && j.d && roleIds.has(j.role) && arr(j.also).every(r => roleIds.has(r)) && built.includes(j.status) && arr(j.steps).length)).map(j => j.id || '(no id)'),
  'journeys have id, name, role, dom, outcome, d and steps');
const probs = [];
J.forEach(j => {
  const steps = arr(j.steps); if (!steps.length) return;
  const sid = new Set(steps.map(s => s.id));
  const tg = s => [...arr(s.next), ...arr(s.alt).map(a => a[0]), ...arr(s.err).map(a => a[0])];
  steps.forEach(s => {
    if (!stepTypes.includes(s.t)) probs.push(s.id + ' type');
    if (!(s.id && s.n && s.d && s.src)) probs.push(s.id + ' needs id, n, d, src');
    if (!fId.has(s.f)) probs.push(s.id + ' feature');
    arr(s.fns).forEach(f => { if (!fnId.has(f)) probs.push(s.id + ' fn ' + f); });
    arr(s.nodes).forEach(n => { if (!set.has(n)) probs.push(s.id + ' node ' + n); });
    tg(s).forEach(t => { if (!sid.has(t)) probs.push(s.id + ' -> ' + t); if (t === s.id) probs.push(s.id + ' points at itself'); });
    if (s.t === 'decision' && tg(s).length < 2) probs.push(s.id + ' decision needs 2+ exits');
    if (s.t === 'success' && tg(s).length) probs.push(s.id + ' success must end the journey');
    if (!s.col && s.t !== 'success' && !arr(s.next).length) probs.push(s.id + ' main-path step has no next');
    if (s.col !== undefined && s.col !== 0 && s.col !== 1) probs.push(s.id + ' col must be 0 or 1');
    if (String(s.n).length > 34) probs.push(s.id + ' name over 34 characters');
    [...arr(s.alt), ...arr(s.err)].forEach(a => { if (!a[1] || String(a[1]).length > 24) probs.push(s.id + ' branch label missing or over 24 characters'); });
  });
  const seen = new Set([steps[0].id]), q = [steps[0]];
  while (q.length) tg(q.pop()).forEach(t => { const nx = steps.find(s => s.id === t); if (nx && !seen.has(t)) { seen.add(t); q.push(nx); } });
  steps.forEach(s => { if (!seen.has(s.id)) probs.push(s.id + ' unreachable from the first step'); });
  const main = steps.filter(s => !s.col);
  if (steps[0].col) probs.push(j.id + ' must start on the main path');
  if (!main.length || main[main.length - 1].t !== 'success') probs.push(j.id + ' main path must end in a success step');
});
bad(probs, 'journey steps valid, branches resolve, every step reachable');
warn(R.filter(r => !J.some(j => j.role === r.id)).map(r => r.id), 'every role starts at least one journey');
warn(F.filter(f => !J.some(j => arr(j.steps).some(s => s.f === f.id))).map(f => f.id), 'every feature appears in a journey');

// ---- overview ----
const obId = new Set(OB.map(b => b.id));
ok(O.groups.every(g => Array.isArray(g) && g.length === 2 && /^[a-z0-9-]+$/.test(g[0]) && g[1]), 'overview groups are [key, label] pairs');
bad(OB.filter(b => !(b.id && b.name && b.d && icons.includes(b.icon) && kinds.includes(b.k) && [0, 1, 2].includes(b.col) && arr(b.nodes).length && String(b.name).length <= 30)).map(b => b.id || '(no id)'),
  'overview blocks have id, name (30), d, icon, k, col and components');
ok([0, 1, 2].every(c => OB.some(b => b.col === c)), 'each of the three overview columns has a block');
const owner = {}; OB.forEach(b => arr(b.nodes).forEach(n => (owner[n] = owner[n] || []).push(b.id)));
bad(ids.filter(n => (owner[n] || []).length !== 1).map(n => n + ':' + (owner[n] || []).length), 'every component sits in exactly one overview block');
bad(Object.keys(owner).filter(n => !set.has(n)), 'overview blocks reference existing components');
const pair = (x, y) => [x, y].sort().join('|');
bad(OL.filter(l => !obId.has(l.a) || !obId.has(l.b) || l.a === l.b || !l.label).map(l => l.a + '>' + l.b), 'overview links reference existing blocks and have a label');
bad(OL.map(l => pair(l.a, l.b)).filter((k, i, a) => a.indexOf(k) !== i), 'no duplicate overview links');
const real = new Set(E.filter(e => owner[e.from] && owner[e.to]).map(e => [owner[e.from][0], owner[e.to][0]]).filter(([x, y]) => x !== y).map(([x, y]) => pair(x, y)));
const drawn = new Set(OL.map(l => pair(l.a, l.b)));
bad([...real].filter(k => !drawn.has(k)).map(k => 'missing ' + k).concat([...drawn].filter(k => !real.has(k)).map(k => 'unbacked ' + k)),
  `overview links match the relationships between blocks (${drawn.size})`);
const wrapN = (s, n) => { let c = '', k = 0; String(s).split(' ').forEach(w => { if (c && (c + ' ' + w).length > n) { k++; c = w; } else c = c ? c + ' ' + w : w; }); return k + (c ? 1 : 0); };
bad(OB.filter(b => wrapN(b.d, 48) > 3).map(b => b.id + ':' + wrapN(b.d, 48) + ' lines'), 'overview descriptions fit three lines of 48 characters');

// ---- ids ----
const everything = [...ids, ...OB.map(b => b.id), ...F.map(f => f.id), ...subs.map(s => s.id), ...fns.map(f => f.id), ...J.map(j => j.id), ...J.flatMap(j => arr(j.steps).map(s => s.id))];
bad(everything.filter((k, i, a) => a.indexOf(k) !== i), 'ids unique across components, blocks, features, capabilities, functions, journeys and steps');
bad([...everything, ...R.map(r => r.id)].filter(k => !/^[A-Za-z0-9_-]+$/.test(String(k)) || String(k).startsWith('arch')), 'ids use only letters, digits, - and _ (and do not start with "arch")');
warn(R.map(r => r.id).filter(k => everything.includes(k)), 'role ids differ from every other id');
if (A.chat) ok(Array.isArray(A.chat.starters) && A.chat.starters.length <= 4 && A.chat.starters.every(q => typeof q === 'string' && q.length <= 70), 'chat starters: up to 4 questions of at most 70 characters');

// ---- source references resolve in the repo (only with --repo) ----
if (repo) {
  const refs = [];
  N.forEach(n => [n.sourceRef, ...arr(n.refs)].forEach(r => refs.push([n.id, r])));
  F.forEach(f => arr(f.src).forEach(r => refs.push([f.id, r])));
  fns.forEach(f => refs.push([f.id, f.src, f.name]));
  R.forEach(r => arr(r.src).forEach(x => refs.push([r.id, x])));
  J.forEach(j => arr(j.steps).forEach(s => refs.push([s.id, s.src])));
  const cache = {}, missing = [], range = [], far = [];
  refs.forEach(([id, ref, name]) => {
    const m = /^(.*?)(?::(\d+))?$/.exec(String(ref)), target = path.resolve(repo, m[1]);
    if (!target.startsWith(path.resolve(repo))) { missing.push(id + ' ' + ref + ' (outside the repo)'); return; }
    if (/(^|\/)\.env|\.pem$|\.key$|id_rsa/.test(m[1])) { missing.push(id + ' ' + ref + ' (secret files must not be cited)'); return; }
    if (!(target in cache)) cache[target] = fs.existsSync(target) && fs.statSync(target).isFile() ? fs.readFileSync(target, 'utf8').split('\n') : null;
    const lines = cache[target];
    if (!lines) { missing.push(id + ' ' + ref); return; }
    if (m[2] && +m[2] > lines.length) { range.push(id + ' ' + ref); return; }
    if (name && m[2] && /^[A-Za-z_]+$/.test(name)) {
      const near = lines.slice(Math.max(0, +m[2] - 4), +m[2] + 3).join('\n');
      if (!near.includes(name)) far.push(id + ' ' + name + ' @ ' + ref);
    }
  });
  bad(missing, `cited source files exist (${refs.length} references)`);
  bad(range, 'cited line numbers are within the file');
  warn(far, 'single-word function names appear within 3 lines of their cited line');
} else {
  out.push('SKIP source references not checked (pass --repo <repo root> to check them)');
}

// ---- nothing sensitive ----
const text = JSON.stringify(A);
const secret = /(price_[A-Za-z0-9]{8,}|sk_(live|test)_|pk_(live|test)_|rk_(live|test)_|whsec_|eyJ[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abprs]-|hooks\.slack\.com\/services|-----BEGIN [A-Z ]*PRIVATE KEY|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})/;
const sm = text.match(secret);
ok(!sm, 'no keys, tokens, price ids or email addresses in the map' + (sm ? ' -> ' + sm[0].slice(0, 24) : ''));

console.log(`components=${N.length} relationships=${E.length} blocks=${OB.length} features=${F.length} capabilities=${subs.length} functions=${fns.length} roles=${R.length} journeys=${J.length} steps=${J.reduce((n, j) => n + arr(j.steps).length, 0)}`);
finish();
