const assert = require('assert');
const fs = require('fs');
const path = require('path');
const collectiblePolicy = require('../collectible-policy.js');
const displayPolicy = require('../monster-display-policy.js');

const monsterIds = Object.keys(collectiblePolicy.COLLECTIBLE_CATALOG).sort();
assert.deepEqual(Object.keys(displayPolicy.MONSTER_IMAGE_BY_TYPE).sort(), monsterIds, 'every current monster has a combat-slot image');
monsterIds.forEach((monsterId) => {
  const imagePath = displayPolicy.MONSTER_IMAGE_BY_TYPE[monsterId].split('?')[0];
  assert.ok(fs.existsSync(path.join(__dirname, '..', imagePath)), `${monsterId} combat-slot image exists`);
});
assert.equal(displayPolicy.getMonsterLevel({ min: 3, max: 5 }, 1), 3, 'monster level does not fall below the map minimum');
assert.equal(displayPolicy.getMonsterLevel({ min: 3, max: 5 }, 4), 4, 'monster level follows player level inside the map range');
assert.equal(displayPolicy.getMonsterLevel({ min: 3, max: 5 }, 8), 5, 'monster level does not exceed the map maximum');
assert.equal(displayPolicy.getRankDisplay({ isBoss: true }).className, 'boss', 'boss rank has a dedicated slot class');
assert.equal(displayPolicy.getRankDisplay({ isElite: true }).className, 'elite', 'elite rank has a dedicated slot class');
assert.deepEqual(displayPolicy.getStatusDisplays([{ type: 'burn' }, { type: 'burn' }, { type: 'poison' }]).map((status) => status.label), ['燃燒', '中毒'], 'status icons are unique and ordered');

console.log('monster-display-policy: 46 assertions passed');
