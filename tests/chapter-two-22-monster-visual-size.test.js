const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const expectedScales = {
  blackstoneTrailRaider: '1.05',
  blackstoneArcher: '1.05',
  blackstonePoisonSpider: '.9',
  blackstoneBeastmaster: '1.08',
  blackstoneCaptain: '1.15',
  blackstoneCenturion: '1.2'
};

for (const [monsterId, scale] of Object.entries(expectedScales)) {
  const escapedScale = scale.replace('.', '\\.');
  assert.match(script, new RegExp(`${monsterId}: ${escapedScale}`), `${monsterId} uses its requested 2-2 display scale`);
}

assert.doesNotMatch(script, /blackstoneTrailScout:\s*[.\d]+/, 'the 2-2 blackstone scout remains at its current display scale');
assert.match(script, /const visualScaleCorrection = enemy\.visualScaleCorrection \|\| monsterVisualScaleCorrections\[enemy\.id\] \|\| 1;/, 'battle rendering uses independent monster scale corrections');

console.log('chapter-two-22-monster-visual-size: assertions passed');
