const assert = require('assert');
const policy = require('../equipment-policy.js');

const inventory = [
  { id: 'healing-potion', kind: 'consumable' },
  { id: 'goblin-camp-map', kind: 'material' },
  { id: 'starter-warrior-weapon-0', kind: 'equipment', name: '新兵鐵劍' },
  { id: 'goblin-sword-123', kind: 'equipment', name: '哥布林短劍' },
  { id: 'altar-set-456', kind: 'equipment', name: '暮衛戰刃' }
];

assert.equal(policy.isRecruitEquipment(inventory[2]), true, 'starter equipment is retained');
assert.equal(policy.isRecruitEquipment(inventory[3]), false, 'monster equipment is not retained');
assert.deepEqual(policy.removeLegacyEquipmentFromInventory(inventory).map((item) => item.id), [
  'healing-potion',
  'goblin-camp-map',
  'starter-warrior-weapon-0'
], 'materials, consumables and recruit equipment survive the reset');

const weapons = policy.WEAPON_CATALOG;
assert.deepEqual([weapons.shortIronSword.attackMin, weapons.shortIronSword.attackMax, weapons.shortIronSword.attackSpeed], [8, 11, 1.40], 'short iron sword stats match the design');
assert.deepEqual([weapons.knightLongsword.attackMin, weapons.knightLongsword.attackMax, weapons.knightLongsword.attackSpeed], [10, 14, 1.20], 'knight longsword stats match the design');
assert.deepEqual([weapons.mercenaryGreatsword.attackMin, weapons.mercenaryGreatsword.attackMax, weapons.mercenaryGreatsword.attackSpeed], [18, 24, .80], 'mercenary greatsword stats match the design');
assert.deepEqual([weapons.giantIronSword.attackMin, weapons.giantIronSword.attackMax, weapons.giantIronSword.attackSpeed], [21, 28, .65], 'giant iron sword stats match the design');
assert.equal(policy.rollWeaponAttack(weapons.shortIronSword, 0), 8, 'minimum roll uses the lower attack bound');
assert.equal(policy.rollWeaponAttack(weapons.shortIronSword, .999), 11, 'maximum roll uses the upper attack bound');
assert.equal(policy.getAttacksPerSecond(weapons.giantIronSword, 1), .65, 'weapon speed is measured in attacks per second');

console.log('equipment-policy: 21 assertions passed');
