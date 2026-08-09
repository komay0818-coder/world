const assert = require('node:assert/strict');
const policy = require('../forest-altar-policy.js');

assert.equal(policy.MAP.id, 'forest-altar');
assert.equal(policy.MAP.name, '森林祭壇');
assert.equal(policy.MAP.enemyPoolId, 'forest-altar-enemies');
assert.equal(policy.MAP.bossId, 'corrupted-altar-guardian');
assert.equal(policy.MAP.implemented, false);
assert.equal(policy.MAP.contentStatus, 'monster-roster');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '腐化森林狼', '荊棘魔藤', '腐化黑石士兵', '祭壇守衛', '腐化黑石祭司', '墮落德魯伊', '腐化祭壇守護者'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'elite', 'elite', 'elite', 'boss']);
assert.deepEqual(policy.getMonsterPool(), {
  normal: ['corrupted-forest-wolf', 'thorn-demon-vine', 'corrupted-blackstone-soldier'],
  elite: ['altar-guard', 'corrupted-blackstone-priest', 'fallen-druid'],
  boss: ['corrupted-altar-guardian']
});
assert.equal(policy.getMonster('fallen-druid').name, '墮落德魯伊');
assert.equal(policy.getMonster('corrupted-forest-wolf').image, 'assets/corrupted-forest-wolf.png');
assert.equal(policy.getMonster('unknown'), null);
assert.ok(policy.MONSTERS.every((monster) => monster.chapter === 2 && monster.mapId === 'forest-altar'));
assert.equal(policy.MONSTERS.filter((monster) => monster.image !== null).length, 1);
assert.ok(policy.MONSTERS.every((monster) => monster.stats === null
  && monster.dropTableId === null && monster.skillIds.length === 0 && monster.aiProfileId === null && monster.implemented === false));
const fs = require('node:fs');
const path = require('node:path');
const wolf = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-forest-wolf').image));
assert.equal(wolf.subarray(1, 4).toString(), 'PNG', 'the corrupted forest wolf is a PNG asset');
assert.equal(wolf[25], 6, 'the corrupted forest wolf uses RGBA color with transparency');

console.log('forest-altar-policy: assertions passed');
