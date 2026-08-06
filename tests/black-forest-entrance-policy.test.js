const assert = require('node:assert/strict');
const policy = require('../black-forest-entrance-policy.js');

assert.equal(policy.MAP.id, 'black-forest-entrance');
assert.equal(policy.MAP.chapter, 2);
assert.equal(policy.MAP.order, 1);
assert.equal(policy.MAP.enemyPoolId, 'black-forest-entrance-enemies');
assert.equal(policy.MAP.bossId, 'forest-guardian');
assert.equal(policy.MAP.implemented, false);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '黑森林野狼', '腐化野豬', '暗影蜘蛛', '枯木行者', '黑森林獵人', '森林守護者'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'normal', 'elite', 'boss']);
assert.equal(policy.getMonstersByRank('normal').length, 4);
assert.equal(policy.getMonstersByRank('elite').length, 1);
assert.equal(policy.getMonstersByRank('boss').length, 1);
assert.equal(policy.getMonster('black-forest-hunter').visualStyle, 'night-elf');
assert.deepEqual(policy.getMonster('shadow-spider').tags, ['poison']);
assert.ok(policy.MONSTERS.every((monster) => monster.image === null && monster.stats === null
  && monster.dropTableId === null && monster.aiProfileId === null && monster.skillIds.length === 0
  && monster.implemented === false));
assert.equal(policy.getMonster('unknown'), null);

console.log('black-forest-entrance-policy: assertions passed');
