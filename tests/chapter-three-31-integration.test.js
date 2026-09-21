'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const maps = require('../chapter-three-map-policy.js');
const combat = require('../redrock-wastes-policy.js');

assert.match(index, /chapter-three-progression-policy\.js[\s\S]*script\.js/);
assert.equal(maps.getMap('redrock-wastes-entrance').implemented, true);
assert.equal(maps.getMap('brokenrock-canyon').implemented, true);
assert.ok(maps.MAPS.slice(2).every((map) => map.implemented === false), '3-3 through 3-6 stay closed');
assert.deepEqual(combat.getCombatPool(), {
  normal: ['wasteland-hyena', 'redrock-lizard', 'wasteland-vulture', 'skullcrusher-scout'],
  elite: ['redrock-hornbeast'], boss: ['redrock-giant-lizard']
});
assert.ok([...combat.getCombatPool().normal, ...combat.getCombatPool().elite, ...combat.getCombatPool().boss].every((id) => combat.getCombatMonster(id)?.mapId === 'redrock-wastes-entrance'));
assert.match(script, /\.\.\.ChapterThreeMapPolicy\.MAPS/);
assert.match(script, /function renderRedrockWastesRegions\(\)/);
assert.match(script, /data-select-map="\$\{region\.id\}"/);
assert.match(script, /ChapterThreeProgressionPolicy\.canEnter\(progress, map\.id, map\.implemented\)/);
assert.match(script, /mapId === 'redrock-wastes-entrance'\) return mapMonsterPools\.redrockWastes/);
assert.match(script, /mapId === 'redrock-wastes-entrance'\) return RedrockWastesPolicy\.getCombatMonster/);
assert.match(script, /currentMap\.chapter === 3 && enemy\.isBoss[\s\S]*ChapterThreeProgressionPolicy\.recordBossKill/);
assert.match(script, /ChapterThreeProgressionPolicy\.normalize\(progress\)[\s\S]*localStorage\.setItem\('stardust-progress'/, 'saveProgress persists normalized chapter-three progress');
console.log('chapter-three-31-integration: assertions passed');
