#!/usr/bin/env node
// Writes still pictures of every canvas in a built explorer page, so the layout can be looked at without a browser.
//   node snapshot.cjs <explorer.html> <out dir> [--light] [--png]
// Output: one .svg per canvas (overview, each architecture view, features, every feature, journeys, every journey)
// and chat.html, a script-free picture of the chat panel. --png also renders .png files with macOS Quick Look.
// Stills show every line at full strength: the dimming the page applies on hover and selection is not drawn.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { runPage, pageStyle, extractData } = require('./lib.cjs');

const args = process.argv.slice(2), light = args.includes('--light'), png = args.includes('--png');
const [file, outDir] = args.filter(a => !a.startsWith('--'));
if (!file || !outDir) { console.error('usage: node snapshot.cjs <explorer.html> <out dir> [--light] [--png]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8'), css = pageStyle(html), data = extractData(html);
fs.mkdirSync(outDir, { recursive: true });

const sampleAnswer = 'This is where an answer appears. Items are shown as links, for example [[' + data.graph.nodes[0].id + ']] and [[' + data.overview.blocks[0].id + ']].\n- A first point\n- A second point with `code`';
const fake = async (input, opts) => { opts.onText({ text: sampleAnswer, delta: '' }); return { text: sampleAnswer, truncated: false }; };

/* eslint-disable no-undef */
async function body() {
  const T0 = d => ({ closest: () => ({ dataset: d }) });
  const shots = {}, snap = k => { shots[k] = { svg: svg.innerHTML, w: bounds.w, h: bounds.h }; };
  snap('overview');
  [['all', 'complete'], ['ai', 'ai'], ['biz', 'business']].forEach(([v, name]) => { if (!VIEW_OFF.has(v)) { setView(v); snap(name); } });
  setView('feat'); snap('features');
  FEATS.forEach(f => { xPick(f.id); snap('feature-' + f.id); nav(T0({ crumb: 'home' })); });
  setView('jour'); snap('journeys');
  JOURS.forEach(j => { xPick(j.id); snap('journey-' + j.id); nav(T0({ crumb: 'home' })); });
  await null; await null; await null;
  chatOpen(true); const empty = chatLog.innerHTML;
  await chatSend('An example question');
  return { shots, chat: [empty, chatLog.innerHTML] };
}
const src = body.toString();

runPage(html, src.slice(src.indexOf('{') + 1, src.lastIndexOf('}')), fake).then(({ shots, chat }) => {
  const bg = light ? '#ffffff' : '#121724', theme = light ? ' data-theme="light"' : '', written = [];
  for (const [k, s] of Object.entries(shots)) {
    // Quick Look thumbnails are square, so each still is padded out to a square.
    const p = 30, side = Math.max(Math.ceil(s.w + p * 2), Math.ceil(s.h + p * 2));
    const inner = s.svg.replace(/ transform="translate\([^"]*scale[^"]*"/, '');
    fs.writeFileSync(path.join(outDir, k + '.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"' + theme + ' width="' + side + '" height="' + side + '" viewBox="' + -p + ' ' + -p + ' ' + side + ' ' + side +
      '" style="font-family:Inter,system-ui,sans-serif"><style><![CDATA[' + css + ']]></style><rect x="' + -p + '" y="' + -p + '" width="' + side + '" height="' + side + '" fill="' + bg + '"/>' + inner + '</svg>');
    written.push(k + '.svg');
  }
  const box = log => '<div class="canvas" style="width:440px;height:620px;flex:none"><section class="chat"><header><b>Ask Claude</b><span>about this map</span><button class="x">New chat</button><button class="x">Close</button></header><div class="log">' +
    log + '</div><form id="chatform"><textarea id="chatq" rows="2" placeholder="Ask about components, features or journeys"></textarea><button class="btn">Send</button></form></section></div>';
  fs.writeFileSync(path.join(outDir, 'chat.html'), '<!doctype html><html' + theme + '><head><meta charset="utf8"><style>' + css + 'html,body{height:auto}</style></head><body style="padding:20px"><div style="display:flex;gap:20px">' +
    box(chat[0]) + box(chat[1]) + '</div></body></html>');
  written.push('chat.html');
  console.log('wrote ' + written.length + ' files to ' + outDir + ': ' + written.join(', '));
  if (png) {
    if (process.platform !== 'darwin') { console.log('--png needs macOS Quick Look (qlmanage); open the .svg files in any browser instead.'); return; }
    let done = 0;
    for (const f of written) {
      const r = cp.spawnSync('qlmanage', ['-t', '-s', '1600', '-o', outDir, path.join(outDir, f)], { stdio: 'ignore' });
      if (r.status === 0 && fs.existsSync(path.join(outDir, f + '.png'))) done++;
    }
    console.log('rendered ' + done + ' of ' + written.length + ' as .png');
  }
}, e => { console.error('snapshot failed: ' + ((e && e.message) || e)); process.exit(1); });
