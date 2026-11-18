#!/usr/bin/env node
// Smoke test for a built explorer page.
//   node smoke.cjs <explorer.html>
// Runs the page's own script against a stand-in for the browser and opens every block, component, feature,
// capability, function, journey and step, every filter, the cross-links between views, and the chat
// (with a stand-in for Claude: no real question is sent). It fails on any error or any "undefined" in what the page draws.
const fs = require('fs');
const { extractData, runPage } = require('./lib.cjs');

const file = process.argv[2];
if (!file) { console.error('usage: node smoke.cjs <explorer.html>'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');
const data = extractData(html);

// Ids from this map that the stand-in answer cites, so link rendering is tested against real data.
const firstFn = data.features.flatMap(f => f.subs.flatMap(s => s.functions.map(fn => ({ feat: f.id, fn: fn.id }))))[0];
const firstStep = data.userJourneys.map(j => ({ jour: j.id, step: j.steps[0].id }))[0];
const CASE = { node: data.graph.nodes[0].id, block: data.overview.blocks[0].id, fn: firstFn, step: firstStep };
const ANSWER = 'It starts at [[' + CASE.node + ']], which **belongs** to [[' + CASE.block + ']].\n' +
  '- First step: [[' + CASE.step.step + ']]\n- Function: [[' + CASE.fn.fn + ']]\n- Unknown: [[nope]] <img src=x>\n## A heading\nTail `code` [[' + CASE.node.slice(0, 2);
const FAKE = { calls: [], mode: 'ok' };
async function fake(input, opts) {
  FAKE.calls.push({ input, opts });
  if (FAKE.mode === 'ok') { opts.onText({ text: ANSWER.slice(0, 20), delta: '' }); opts.onText({ text: ANSWER, delta: '' }); return { text: ANSWER, truncated: false, modelTierApplied: 'default' }; }
  if (FAKE.mode === 'cancelled') { opts.onText({ text: 'Partial answer', delta: '' }); throw { code: 'cancelled', message: '', text: 'Partial answer' }; }
  throw { code: FAKE.mode, message: 'x' };
}

// The body below runs inside the page's scope: every name it uses that is not declared here belongs to the page.
/* eslint-disable no-undef */
async function body() {
  const T0 = d => ({ closest: () => ({ dataset: d }) });
  const must = (c, m) => { if (!c) throw new Error(m); };
  const chk = w => {
    [svg.innerHTML, panel.innerHTML, $('#filters').innerHTML, $('#crumbs').innerHTML, $('#stats').innerHTML, chatLog.innerHTML].forEach((h, i) => {
      const m = /undefined|NaN|\[object/.exec(h);
      if (m) throw new Error(w + ': "' + m[0] + '" in part ' + i + ' near: ' + h.slice(Math.max(0, m.index - 120), m.index + 40));
    });
  };
  let n = 0;
  const archViews = ['all', 'ai', 'biz'].filter(v => !VIEW_OFF.has(v));

  // ---- overview ----
  must(state.view === 'over', 'the page should open on the Overview');
  chk('overview');
  must(!X.cost.through, 'an overview line runs through a block: ' + JSON.stringify(X.cost));
  const routing = JSON.stringify(X.cost) + ', ' + X.w + 'x' + X.h;
  X.geo.forEach((g, i) => must(g && g.pts.length >= 2 && !/NaN|undefined/.test(g.d), 'overview line ' + i + ' has no path'));
  X.items.forEach(o => {
    must(OICON[o.icon], 'unknown icon on ' + o.id);
    must(o.lines.length <= 3, 'description of ' + o.id + ' is over three lines');
    X.items.forEach(p => must(p === o || p.col !== o.col || p.y >= o.y + o.h || o.y >= p.y + p.h, 'blocks overlap: ' + o.id + ' ' + p.id));
  });
  OL.forEach(l => must(l.n > 0, 'overview link with no relationship behind it: ' + l.a + ' ' + l.b));
  OB.forEach(b => { xPick(b.id); chk('block ' + b.id); must(state.xsel && state.xsel.id === b.id, 'block not selected: ' + b.id); n++; });
  xPick(OB[OB.length - 1].id); must(!state.xsel, 'selecting a block twice should clear it');
  ['all', ...OV.groups.map(g => 'g:' + g[0])].forEach(k => { nav(T0({ xf: k })); chk('overview filter ' + k); });
  nav(T0({ xf: 'all' }));
  state.q = OB[0].name.split(' ')[0].toLowerCase(); xApply(); xEnter(); chk('overview search');
  must(state.xsel && state.xsel.type === 'ov', 'overview search did not select a block'); xClear(true);
  oHover({ target: { closest: s => (s === '.node' ? { dataset: { id: OB[0].id } } : null) } }); chk('overview hover block');
  if (X.links.length) {
    oHover({ target: { closest: s => (s === '.edge' ? { dataset: { i: '0' } } : null) }, clientX: 10, clientY: 10 }); chk('overview hover line');
    must(!tip.hidden && tip.innerHTML.includes('relationship') && !/undefined|NaN/.test(tip.innerHTML), 'overview tooltip: ' + tip.innerHTML);
  }
  oHover(null); must(!X.hov && X.hl === null, 'hover state not cleared');
  const b0 = OB[0], n0 = b0.nodes[0];
  nav(T0({ ov: b0.id })); nav(T0({ arch: n0 })); chk('block -> component');
  must(isArch() && state.sel === n0, 'block -> component did not land on ' + n0);
  popBack(); must(state.view === 'over' && state.xsel && state.xsel.id === b0.id, 'Back did not return to the block'); chk('back to block');
  nav(T0({ crumb: 'home' })); must(!state.xsel, 'Overview breadcrumb did not clear the selection');
  nav(T0({ goview: 'feat' })); must(state.view === 'feat', 'Go deeper did not open Features'); popBack(); must(state.view === 'over', 'Back from Go deeper');
  setView('all'); select(n0, true); must(panel.innerHTML.includes('data-ov="' + b0.id + '"'), 'component panel does not name its overview block');
  nav(T0({ ov: b0.id })); must(state.view === 'over' && state.xsel.id === b0.id, 'component -> block'); chk('component -> block');
  popBack(); must(isArch(), 'Back from block'); backs.length = 0;

  // ---- architecture views ----
  archViews.forEach(v => {
    setView(v); chk('view ' + v);
    N.forEach(x => { if (inView(x)) { select(x.id, true); chk('component ' + x.id); n++; } });
    FILTER_ORDER.forEach(f => { setFilter(f); chk('filter ' + f); setFilter(f); });
    if (v === 'all') ARCH.flows.forEach((f, i) => { state.flow = i; state.sel = null; apply(); drawPanel(); chk('flow ' + f.name); });
    clearAll();
  });

  // ---- features ----
  setView('feat'); chk('features');
  FEAT_FILTERS.forEach(([k]) => { nav(T0({ xf: k })); chk('feature filter ' + k); });
  nav(T0({ xf: 'all' }));
  state.q = FEATS[0].name.split(' ')[0].toLowerCase(); xApply(); xEnter(); chk('feature search'); nav(T0({ crumb: 'home' }));
  FEATS.forEach(f => {
    xPick(f.id); chk('feature ' + f.id);
    f.subs.forEach(s => { xPick(s.id); chk('capability ' + s.id); s.functions.forEach(fn => { xPick(fn.id); chk('function ' + fn.id); n++; }); });
    X.geo.forEach((g, i) => must(g, 'feature ' + f.id + ' link ' + i + ' has no path'));
    xPick(f.id); state.q = 'a'; xApply(); xEnter(); state.q = ''; nav(T0({ crumb: 'home' }));
  });

  // ---- journeys ----
  setView('jour'); chk('journeys');
  ['all', 'ai', 'partial', ...ROLES.map(r => 'role:' + r.id)].forEach(k => { nav(T0({ xf: k })); chk('journey filter ' + k); });
  nav(T0({ xf: 'all' }));
  state.q = JOURS[0].name.split(' ')[0].toLowerCase(); xApply(); xEnter(); chk('journey search'); nav(T0({ crumb: 'home' }));
  JOURS.forEach(j => {
    xPick(j.id); chk('journey ' + j.id);
    const seen = {};
    X.items.forEach(i => { const k = i.row + ':' + i.col; must(!seen[k], 'steps overlap in ' + j.id + ': ' + i.id + ' ' + seen[k]); seen[k] = i.id; });
    X.geo.forEach((g, i) => must(g, 'journey ' + j.id + ' link ' + i + ' has no path'));
    ['main', 'alt', 'err', 'all'].forEach(p => { nav(T0({ path: p })); chk(j.id + ' path ' + p); });
    state.path = 'all';
    j.steps.forEach(s => { xPick(s.id); chk('step ' + s.id); n++; });
    nav(T0({ crumb: 'top' })); nav(T0({ crumb: 'role:' + j.role })); nav(T0({ crumb: 'home' }));
  });

  // ---- cross-links: journey step -> function -> component and back ----
  const st = Object.values(stepById).find(s => s.fns.length && fnById[s.fns[0]].nodes.length);
  if (st) {
    const fn = fnById[st.fns[0]], nd = fn.nodes[0];
    nav(T0({ jour: st.jour, step: st.id })); chk('open step');
    nav(T0({ feat: fn.feat, fn: fn.id })); chk('step -> function');
    goArch(nd); chk('function -> component');
    must(isArch() && state.sel === nd, 'function -> component did not land on ' + nd);
    must(backs.length === 2, 'expected two Back entries, found ' + backs.length);
    popBack(); must(state.view === 'feat' && state.xsel && state.xsel.id === fn.id, 'first Back should return to the function'); chk('back 1');
    popBack(); must(state.view === 'jour' && state.xsel.id === st.id, 'second Back should return to the step'); chk('back 2');
    setView('all'); select(nd, true); nav(T0({ feat: fn.feat, fn: fn.id })); must(state.view === 'feat', 'component -> function');
    popBack(); must(state.view === 'all' && state.sel === nd, 'Back should return to the component');
  }
  setView('over');

  // ---- chat, with a stand-in for Claude ----
  await null; await null; await null;
  must(chat.ask, 'chat is not wired to Claude');
  must(!askBtn.hidden, 'Ask Claude button stayed hidden');
  chatOpen(true); chk('chat open');
  must(!chatEl.hidden && askBtn.hidden && chatLog.innerHTML.includes('data-q='), 'chat empty state');
  setView('all'); select(CASE.node, true);
  must(chatContext().includes('with ' + CASE.node + ' selected'), 'chat context: ' + chatContext());
  await chatSend('How does this work?');
  const call = FAKE.calls[FAKE.calls.length - 1], last = call.input[call.input.length - 1];
  must(FAKE.calls.length === 1 && call.input[0].role === 'user' && call.input[0].content.includes('===== MAP DATA =====') && last.role === 'user' &&
    last.content.endsWith('How does this work?') && last.content.startsWith('Viewer is looking at:'), 'chat request shape');
  must(call.opts.cache === false && call.opts.signal instanceof AbortSignal && typeof call.opts.onText === 'function', 'chat request options');
  const bytes = Buffer.byteLength(call.input.map(t => t.content).join(''));
  must(bytes < 215000, 'the map text sent to Claude is ' + bytes + ' bytes; the limit is 262144 and the chat needs headroom. Shorten descriptions.');
  [...N.map(x => x.id), ...OB.map(b => b.id), ...FEATS.map(f => f.id), ...Object.keys(subById), ...Object.keys(fnById), ...JOURS.map(j => j.id), ...Object.keys(stepById), ...ROLES.map(r => r.id)]
    .forEach(id => must(chat.digest.includes(id), 'the text sent to Claude leaves out ' + id));
  const dm = /undefined|NaN|\[object/.exec(chat.digest);
  must(!dm, 'the text sent to Claude contains "' + (dm && dm[0]) + '" near: ' + (dm ? chat.digest.slice(Math.max(0, dm.index - 150), dm.index + 40) : ''));
  const h = chatLog.innerHTML; chk('chat answer');
  ['data-arch="' + CASE.node + '"', 'data-ov="' + CASE.block + '"', 'data-jour="' + CASE.step.jour + '" data-step="' + CASE.step.step + '"',
    'data-feat="' + CASE.fn.feat + '" data-fn="' + CASE.fn.fn + '"', '<b>belongs</b>', '<code>code</code>', '<li>', '&lt;img']
    .forEach(k => must(h.includes(k), 'answer is missing ' + k));
  ['nope', '[[', '<img', '##', 'Thinking'].forEach(k => must(!h.includes(k), 'answer should not contain ' + k));
  must(chat.turns.length === 2 && chat.turns[1].role === 'assistant' && !chat.busy, 'chat history after an answer');
  FAKE.mode = 'rate_limited'; await chatSend('again'); must(chat.turns.length === 2 && chatLog.innerHTML.includes('usage limit'), 'rate limit handling');
  FAKE.mode = 'cancelled'; await chatSend('stop me'); must(chat.turns.length === 4 && chatLog.innerHTML.includes('Partial answer') && chatLog.innerHTML.includes('Stopped.'), 'stop handling');
  FAKE.mode = 'ok'; for (let i = 0; i < 8; i++) await chatSend('q' + i);
  must(chat.turns.length <= 12 && chat.turns[0].role === 'user' && chat.turns[chat.turns.length - 1].role === 'assistant', 'chat history trimming');
  FAKE.mode = 'not_granted'; await chatSend('x'); must(chat.dead && chatQ.disabled && chatLog.innerHTML.includes('not available'), 'declined-permission handling');
  const before = FAKE.calls.length; await chatSend('y'); must(FAKE.calls.length === before, 'a question was sent after permission was declined');
  chat.dead = false; chatReset(); must(!chat.msgs.length && !chat.turns.length && chatLog.innerHTML.includes('data-q='), 'New chat');
  chatOpen(false); must(chatEl.hidden && !askBtn.hidden, 'Close chat');

  return n + ' items opened; overview lines ' + routing + (X.cost && X.cost.overlap ? ' (some lines share a path)' : '') + '; chat sends ' + bytes + ' bytes per question';
}

const src = body.toString();
const inner = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));
// CASE and FAKE are handed to the page scope through globalThis for the length of the run.
globalThis.CASE = CASE; globalThis.FAKE = FAKE;
runPage(html, inner, fake).then(
  r => { console.log('SMOKE PASS: ' + r); },
  e => { console.error('SMOKE FAIL: ' + ((e && e.message) || e)); if (process.env.EXPLORER_DEBUG) console.error(e && e.stack); process.exit(1); }
);
