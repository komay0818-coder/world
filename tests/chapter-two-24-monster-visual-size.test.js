const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const expectedScales = {
  blackstoneStrongholdGuard: '1.05',
  blackstoneStrongholdCrossbowman: '.919275',
  blackstoneStrongholdWarhound: '.85',
  blackstoneStrongholdLionGuard: '1.15',
  blackstoneStrongholdBullhornWarrior: '1.15',
  blackstoneStrongholdWarlord: '1.3'
};

for (const [monsterId, scale] of Object.entries(expectedScales)) {
  assert.match(script, new RegExp(`${monsterId}: ${scale.replace('.', '\\.')}`), `${monsterId} uses its requested 2-4 display scale`);
}

assert.doesNotMatch(script, /blackstoneStrongholdBerserker:\s*[.\d]+/, 'the 2-4 blackstone berserker remains at its current display scale');
assert.match(script, /const visualScaleCorrection = enemy\.visualScaleCorrection \|\| monsterVisualScaleCorrections\[enemy\.id\] \|\| 1;/, 'battle rendering uses independent monster scale corrections');

console.log('chapter-two-24-monster-visual-size: assertions passed');
