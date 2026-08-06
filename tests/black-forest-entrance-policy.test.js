const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
assert.equal(policy.getMonster('black-forest-wolf').image, 'assets/black-forest-wolf.png');
assert.equal(policy.getMonster('corrupted-boar').image, 'assets/corrupted-boar.png');
assert.equal(policy.getMonster('shadow-spider').image, 'assets/shadow-spider.png');
assert.ok(policy.MONSTERS.filter((monster) => !['black-forest-wolf', 'corrupted-boar', 'shadow-spider'].includes(monster.id)).every((monster) => monster.image === null));
assert.ok(policy.MONSTERS.every((monster) => monster.stats === null && monster.dropTableId === null
  && monster.aiProfileId === null && monster.skillIds.length === 0 && monster.implemented === false));
assert.equal(policy.getMonster('unknown'), null);

['black-forest-wolf.png', 'corrupted-boar.png', 'shadow-spider.png'].forEach((filename) => {
  const png = fs.readFileSync(path.join(__dirname, '..', 'assets', filename));
  assert.equal(png.subarray(1, 4).toString(), 'PNG', `${filename} is a PNG asset`);
  assert.equal(png[25], 6, `${filename} uses RGBA color type with an alpha channel`);
});

console.log('black-forest-entrance-policy: assertions passed');
