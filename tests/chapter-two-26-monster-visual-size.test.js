const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

[
  ['depthsCorruptedForestWolf', '1.05'],
  ['corruptedTreant', '1.155'],
  ['forestSpirit', '1.08'],
  ['corruptedBlackstoneCenturion', '1.1484'],
  ['corruptedFallenDruid', '1.06'],
  ['heartOfTheBlackForest', '1.5525']
].forEach(([monsterId, scale]) => {
  assert.match(script, new RegExp(`\\b${monsterId}: ${scale.replace('.', '\\.')},`), `${monsterId} keeps its independent 2-6 visual scale`);
});

assert.match(script, /corruptedForestWolf: 1\.05,[\s\S]*depthsCorruptedForestWolf: 1\.05,/, '2-6 corrupted forest wolf uses the 2-5 scale');
assert.match(script, /fallenDruid: 1\.06,[\s\S]*corruptedFallenDruid: 1\.06,/, '2-6 corrupted fallen druid is restored to the shared 2-5 scale');
assert.match(script, /blackstoneCenturion: 1\.32,[\s\S]*corruptedBlackstoneCenturion: 1\.1484,/, '2-6 corrupted blackstone centurion applies the requested reduction after the shared 2-2 scale');

console.log('chapter-two-26-monster-visual-size: assertions passed');
