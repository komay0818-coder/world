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

console.log('equipment-policy: 5 assertions passed');
