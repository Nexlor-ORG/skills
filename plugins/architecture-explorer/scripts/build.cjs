#!/usr/bin/env node
// Builds the interactive explorer page from map data.
//   node build.cjs <architecture.json> <out.html>
// Reads the template that ships with the plugin, puts the data in, and writes one self-contained HTML file.
const fs = require('fs');
const { TEMPLATE } = require('./lib.cjs');

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node build.cjs <architecture.json> <out.html>'); process.exit(2); }

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!data.project || !data.project.name) { console.error('architecture.json needs project.name'); process.exit(1); }
const nodes = (data.graph && data.graph.nodes) || [];
const count = k => nodes.filter(n => n.kind === k).length;
// Header counts are always derived from the components, so they cannot drift from the map.
data.stats = { agents: count('agent'), models: count('model'), tools: count('tool'),
  integrations: (data.topIntegrations || []).length || count('external') };

const template = fs.readFileSync(TEMPLATE, 'utf8');
for (const mark of ['__TITLE__', '__ARCH_JSON__']) {
  if (template.split(mark).length !== 2) { console.error('template is missing its ' + mark + ' marker'); process.exit(1); }
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// "<" is written as an escape so no text in the data can close the script tag; the two line-separator characters are escaped for older parsers.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(data).split('<').join('\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
const html = template.replace('__TITLE__', () => esc(data.project.name) + ' Architecture Map').replace('__ARCH_JSON__', () => json);
fs.writeFileSync(out, html);
console.log('built ' + out + ': ' + nodes.length + ' components, ' + ((data.graph && data.graph.edges) || []).length + ' relationships, ' +
  (data.features || []).length + ' features, ' + (data.userJourneys || []).length + ' journeys, ' + Buffer.byteLength(html) + ' bytes');
