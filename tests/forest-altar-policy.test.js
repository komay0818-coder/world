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
assert.equal(policy.getMonster('unknown'), null);
assert.ok(policy.MONSTERS.every((monster) => monster.chapter === 2 && monster.mapId === 'forest-altar'));
assert.ok(policy.MONSTERS.every((monster) => monster.image === null && monster.stats === null
  && monster.dropTableId === null && monster.skillIds.length === 0 && monster.aiProfileId === null && monster.implemented === false));

console.log('forest-altar-policy: assertions passed');
