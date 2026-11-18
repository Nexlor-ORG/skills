// Shared helpers for the Architecture Explorer scripts. Nothing here touches the network or the scanned repository.
const fs = require('fs'), path = require('path');

const TEMPLATE = path.join(__dirname, '..', 'template', 'explorer.html');

/** Reads map data from an architecture.json file or from a page built by build.cjs. */
function readData(file) {
  const text = fs.readFileSync(file, 'utf8');
  return /\.json$/i.test(file) ? JSON.parse(text) : extractData(text);
}

/** Pulls the data back out of a built page. The data block of a built page is plain JSON, so nothing is executed. */
function extractData(html) {
  const a = html.indexOf('/*DATA*/'), b = html.indexOf('/*END*/');
  if (a < 0 || b < 0) throw new Error('No data block found: this is not an Architecture Explorer page.');
  const m = /^\s*const ARCH=([\s\S]*);\s*$/.exec(html.slice(a + 8, b));
  if (!m) throw new Error('The data block is not in the format build.cjs writes.');
  try { return JSON.parse(m[1]); }
  catch (e) { throw new Error('The data block is not plain JSON (' + e.message + '). Pages built before this plugin cannot be extracted.'); }
}

/** The page's scripts, joined in page order (the theme script, then the main one). */
function pageScript(html) {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
}

function pageStyle(html) {
  return html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
}

function stubEl() {
  return { innerHTML: '', textContent: '', value: '', hidden: false, disabled: false, placeholder: '', dataset: {}, style: {}, scrollTop: 0,
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } }, focus() {},
    addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, querySelector() { return stubEl(); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { width: 900, height: 600, left: 0, top: 0 }; }, scrollIntoView() {}, setPointerCapture() {}, closest() { return null; } };
}

/**
 * Runs the explorer's own script against a stand-in for the browser, then runs `body` in the same scope.
 * `sample` stands in for Claude so the chat can be exercised without a real call. Resolves with whatever `body` returns.
 */
function runPage(html, body, sample) {
  const els = {}, rootAttrs = {};
  // The root element keeps its attributes, so the theme the page sets on it can be read back.
  const documentElement = Object.assign(stubEl(), { setAttribute(k, v) { rootAttrs[k] = String(v); }, getAttribute(k) { return k in rootAttrs ? rootAttrs[k] : null; } });
  const document = { documentElement, querySelector(s) { return els[s] || (els[s] = stubEl()); }, querySelectorAll() { return []; }, addEventListener() {} };
  const win = { addEventListener() {} };
  if (sample) win.claude = { use: async n => (n === 'sample' ? sample : null) };
  // The page gets its own empty storage, so it never reaches Node's.
  const store = {}, localStorage = { getItem: k => (k in store ? store[k] : null), setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; } };
  const fn = new Function('document', 'window', 'matchMedia', 'getSelection', 'navigator', 'localStorage',
    'return (async()=>{' + pageScript(html) + '\n' + body + '\n})()');
  return fn(document, win, () => ({ matches: false }), () => ({}), {}, localStorage);
}

module.exports = { TEMPLATE, readData, extractData, pageScript, pageStyle, runPage };
