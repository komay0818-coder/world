'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const maps = require('../chapter-three-map-policy.js');
const combat = require('../bloodwar-wastes-policy.js');

assert.equal(maps.getMap('bloodwar-wastes').implemented, true);
assert.equal(maps.getMap('skullcrusher-war-camp').implemented, false);
assert.deepEqual(combat.getCombatPool(), {
  normal: ['skullcrusher-berserker', 'skullcrusher-shieldguard', 'skullcrusher-hunter', 'skullcrusher-shaman'],
  elite: ['skullcrusher-centurion'], boss: ['skullcrusher-vanguard-commander']
});
assert.ok([...combat.getCombatPool().normal, ...combat.getCombatPool().elite, ...combat.getCombatPool().boss]
  .every((id) => combat.getCombatMonster(id)?.mapId === 'bloodwar-wastes'));
assert.match(script, /mapId === 'bloodwar-wastes'\) return mapMonsterPools\.bloodwarWastes/);
assert.match(script, /mapId === 'bloodwar-wastes'\) return BloodwarWastesPolicy\.getCombatMonster/);
assert.match(script, /BloodwarWastesPolicy\.resolveScheduledActions/);
assert.match(script, /BloodwarWastesPolicy\.updateThresholds/);
assert.match(script, /bloodwarAction\?\.damageMultiplier/);
assert.match(script, /BloodwarWastesPolicy\.getCenturionAuraDefenseMultiplier/);
assert.match(script, /ChapterThreeProgressionPolicy\.recordBossKill\(progress, currentMap\.id, enemy\)/);

console.log('chapter-three-33-integration: assertions passed');
