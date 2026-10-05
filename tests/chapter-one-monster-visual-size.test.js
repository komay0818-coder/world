'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

[
  ['plainsRabbit', '.59616'],
  ['plainsWolfPup', '.6156'],
  ['plainsSlime', '.50864'],
  ['plainsGoblinYoung', '.76'],
  ['lostGoblin', '.9215'],
  ['ragingWolf', '1.1'],
  ['greatfangWolf', '1.2']
].forEach(([enemyId, scale]) => {
  assert.match(script, new RegExp(`${enemyId}:\\s*${scale.replace('.', '\\.')}`), `${enemyId} uses its approved chapter-one visual scale`);
});

console.log('chapter-one-monster-visual-size: all assertions passed');
