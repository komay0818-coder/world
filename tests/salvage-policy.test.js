const assert = require('node:assert/strict');
const policy = require('../salvage-policy.js');

const equipment = (id, quality) => ({ id, instanceId: id, kind: 'equipment', name: id, quality, rarity: quality });
assert.deepEqual(policy.getReward(equipment('white', 'common')), { id: 'iron-ore', quantity: 1 });
assert.deepEqual(policy.getReward(equipment('green', 'uncommon')), { id: 'equipment-stone-uncommon', quantity: 1 });
assert.deepEqual(policy.getReward(equipment('blue', 'rare')), { id: 'equipment-stone-rare', quantity: 1 });
assert.deepEqual(policy.getReward(equipment('purple', 'epic')), { id: 'equipment-stone-epic', quantity: 1 });
assert.equal(policy.getReward({ id: 'iron-ore', kind: 'material' }), null);

const progress = { inventory: [equipment('green', 'uncommon'), { id: 'equipment-stone-uncommon', kind: 'material', quantity: 2 }] };
const result = policy.salvage(progress, 'green');
assert.equal(result.ok, true);
assert.equal(progress.inventory.some((item) => item.id === 'green'), false);
assert.equal(progress.inventory.find((item) => item.id === 'equipment-stone-uncommon').quantity, 3);
assert.deepEqual(policy.salvage(progress, 'missing'), { ok: false, code: 'missing-item' });

console.log('salvage-policy tests passed');
