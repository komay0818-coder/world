const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

[
  ['corruptedForestWolf', '1.05'],
  ['thornDemonVine', '.9'],
  ['corruptedBlackstoneSoldier', '1.08'],
  ['altarGuard', '1.15'],
  ['corruptedBlackstonePriest', '1.03'],
  ['fallenDruid', '1.06'],
  ['corruptedAltarGuardian', '1.3']
].forEach(([monsterId, scale]) => {
  assert.match(script, new RegExp(`\\b${monsterId}: ${scale.replace('.', '\\.')},`), `${monsterId} keeps its independent 2-5 visual scale`);
});

assert.match(script, /const visualScaleCorrection = enemy\.visualScaleCorrection \|\| monsterVisualScaleCorrections\[enemy\.id\] \|\| 1;/, 'battle rendering uses independent monster scale corrections');

console.log('chapter-two-25-monster-visual-size: assertions passed');
