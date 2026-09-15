const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const displayPolicy = require('../monster-display-policy.js');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const dungeonCss = fs.readFileSync(path.join(root, 'styles', 'dungeon.css'), 'utf8');
const legacyIds = ['rootExecutioner', 'altarNightblade', 'moonboneSentinel', 'blightOracle', 'eclipseSovereign'];

for (const id of legacyIds) {
  assert.equal(displayPolicy.MONSTER_IMAGE_BY_TYPE[id], undefined, `${id} has no legacy combat artwork mapping`);
  assert.doesNotMatch(script, new RegExp(`\\b${id}\\b`), `${id} is absent from live combat data`);
}
assert.doesNotMatch(script, /dungeonEliteIds|dungeonBossId/, 'the obsolete generic forest dungeon wave pool is removed');
assert.doesNotMatch(dungeonCss, /dungeon-root-executioner|dungeon-nightblade|dungeon-moonbone|dungeon-oracle|dungeon-boss|dungeon-monster-art/, 'legacy forest dungeon artwork rules are removed');

console.log('legacy-forest-dungeon-removal: 12 assertions passed');
