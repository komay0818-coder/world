const assert = require('node:assert/strict');
const policy = require('../inventory-sale-policy.js');

const base = { id: 'base', kind: 'equipment', slot: 'armor', quality: 'common' };
assert.deepEqual(policy.getJunkReasons(base, { level: 10, canEquip: true }), []);
assert.deepEqual(policy.getJunkReasons({ ...base, durability: 0 }, { level: 10, canEquip: true }), ['damaged']);
assert.deepEqual(policy.getJunkReasons({ ...base, requiredLevel: 11 }, { level: 10, canEquip: true }), ['level']);
assert.deepEqual(policy.getJunkReasons(base, { level: 10, canEquip: false }), ['job']);
assert.deepEqual(policy.getJunkReasons({ ...base, isJunk: true }, { level: 10, canEquip: true }), ['marked']);
assert.equal(policy.isJunkCandidate({ kind: 'material', id: 'ore' }, { canEquip: false }), false);
assert.equal(policy.isCommonEquipment(base), true);
assert.equal(policy.isCommonEquipment({ ...base, rarity: 'common', quality: undefined }), true);
assert.equal(policy.isCommonEquipment({ ...base, quality: 'uncommon' }), false);
assert.equal(policy.isCommonEquipment({ id: 'ore', kind: 'material', quality: 'common' }), false);

assert.equal(policy.getSellPrice(base), 10);
assert.equal(policy.getSellPrice({ ...base, quality: 'uncommon' }), 25);
assert.equal(policy.getSellPrice({ ...base, quality: 'rare' }), 60);
assert.equal(policy.getSellPrice({ ...base, quality: 'epic' }), 150);

const inventory = [
  { ...base, id: 'a', isJunk: true },
  { ...base, id: 'b', quality: 'rare' },
  { id: 'ore', kind: 'material', quantity: 5 }
];
const selected = new Set(['a', 'b', 'ore', 'missing']);
const summary = policy.summarizeSelection(inventory, selected, (item) => ({ canEquip: item.id !== 'b', level: 1 }));
assert.equal(summary.count, 2);
assert.equal(summary.gold, 70);
assert.equal(summary.containsJunkCandidate, true);

const progress = { gold: 5, inventory: JSON.parse(JSON.stringify(inventory)) };
const result = policy.sellSelection(progress, selected);
assert.equal(result.ok, true);
assert.equal(result.count, 2);
assert.equal(result.gold, 70);
assert.equal(progress.gold, 75);
assert.deepEqual(progress.inventory, [{ id: 'ore', kind: 'material', quantity: 5 }]);

const untouched = { gold: 12, inventory: [{ ...base, id: 'safe' }] };
assert.equal(policy.sellSelection(untouched, new Set()).ok, false);
assert.deepEqual(untouched, { gold: 12, inventory: [{ ...base, id: 'safe' }] }, 'empty sale changes neither inventory nor gold');

console.log('inventory-sale-policy: assertions passed');
