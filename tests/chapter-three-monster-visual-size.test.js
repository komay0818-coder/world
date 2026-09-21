const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const chapterThree = require('../chapter-three-map-policy.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'monster-slots.css'), 'utf8');
const chapterThreeIds = Object.values(chapterThree.ENEMIES).map((enemy) => enemy.id);

chapterThreeIds.forEach((enemyId) => {
  assert.match(script, new RegExp(`['"]${enemyId}['"]\\s*:\\s*(?:\\d|\\.)`), `${enemyId} has a visual-size correction`);
});

[
  ['wasteland-hyena', '.901'],
  ['redrock-lizard', '1.056'],
  ['wasteland-vulture', '1.1475'],
  ['skullcrusher-scout', '.945'],
  ['redrock-hornbeast', '1.04'],
  ['redrock-giant-lizard', '1.33'],
  ['temple-executioner', '1.38'],
  ['skullcrusher-berserker', '1.06'],
  ['skullcrusher-shieldguard', '1.02'],
  ['skullcrusher-hunter', '.94'],
  ['skullcrusher-shaman', '.94'],
  ['skullcrusher-centurion', '1.04'],
  ['skullcrusher-vanguard-commander', '.96']
].forEach(([enemyId, expectedScale]) => {
  assert.match(
    script,
    new RegExp(`['"]${enemyId}['"]\\s*:\\s*${String(expectedScale).replace('.', '\\.')}`),
    `${enemyId} uses the corrected landscape-art scale`
  );
});

assert.match(
  css,
  /monster-battle-slot\[class\*="visual-size-"\] \.monster-slot-image \{\s*scale: var\(--unit-art-correction, 1\) !important;/,
  'the final battlefield rule applies each monster correction'
);
assert.match(css, /monster-battle-slot\.elite,[\s\S]*?monster-battle-slot\.boss \{[\s\S]*?--unit-rank-scale: 1;/, 'rank does not enlarge artwork');

console.log('chapter-three-monster-visual-size: all assertions passed');
