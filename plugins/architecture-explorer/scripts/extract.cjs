#!/usr/bin/env node
// Recovers architecture.json from a page built by build.cjs, for example one read back from a published artifact.
//   node extract.cjs <explorer.html> <architecture.json>
const fs = require('fs');
const { readData } = require('./lib.cjs');

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node extract.cjs <explorer.html> <architecture.json>'); process.exit(2); }
try {
  const data = readData(src);
  fs.writeFileSync(out, JSON.stringify(data, null, 1));
  console.log('extracted ' + out + ': ' + data.graph.nodes.length + ' components, scanned ' + data.project.date);
} catch (e) { console.error(e.message); process.exit(1); }
