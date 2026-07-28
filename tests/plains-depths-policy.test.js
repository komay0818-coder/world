const assert = require('assert');
const policy = require('../plains-depths-policy');

const expectedNames = [
  '高地野狼', '岩背野豬', '黑石斥侯', '草原禿鷹',
  '黑石掠奪者', '流浪黑騎士', '黑石頭目'
];
const monsters = Object.values(policy.MONSTER_TYPES);

assert.deepEqual(monsters.map((monster) => monster.name), expectedNames, 'all requested monsters are defined');
assert.deepEqual(policy.MONSTER_POOL.normal, ['highlandWolf', 'rockbackBoar', 'blackstoneScout', 'grasslandVulture']);
assert.deepEqual(policy.MONSTER_POOL.elite, ['blackstoneRaider', 'wanderingBlackKnight']);
assert.deepEqual(policy.MONSTER_POOL.boss, ['blackstoneLeader']);
assert.ok(policy.MONSTER_POOL.normal.every((id) => !policy.MONSTER_TYPES[id].isElite && !policy.MONSTER_TYPES[id].isBoss));
assert.ok(policy.MONSTER_POOL.elite.every((id) => policy.MONSTER_TYPES[id].isElite && !policy.MONSTER_TYPES[id].isBoss));
assert.ok(policy.MONSTER_POOL.boss.every((id) => policy.MONSTER_TYPES[id].isBoss));
assert.equal(policy.MONSTER_TYPES.blackstoneScout.artClass, 'plains-depths-blackstone-scout-art');
assert.equal(policy.MONSTER_TYPES.blackstoneRaider.artClass, 'plains-depths-blackstone-raider-art');
assert.equal(policy.MONSTER_TYPES.blackstoneLeader.artClass, 'plains-depths-blackstone-leader-art');
assert.equal(policy.MONSTER_TYPES.grasslandVulture.artClass, 'plains-depths-grassland-vulture-art');
assert.equal(policy.MONSTER_TYPES.highlandWolf.artClass, 'plains-depths-highland-wolf-art');
assert.ok(monsters.filter((monster) => !['blackstoneScout', 'blackstoneRaider', 'blackstoneLeader', 'grasslandVulture', 'highlandWolf'].includes(monster.id)).every((monster) => monster.artClass === 'monster-placeholder-art'));
assert.ok(monsters.every((monster) => monster.lootPending));
assert.equal(new Set(monsters.map((monster) => monster.id)).size, 7, 'monster IDs are unique');

console.log('plains-depths-policy: 15 assertions passed');
