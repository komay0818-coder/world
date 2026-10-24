const assert = require('node:assert/strict');
const policy = require('../inventory-sale-policy.js');
const permanent = require('../permanent-party-policy.js');

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

const account = permanent.createEmptyModel();
account.bag.items.push(
  { id: 'equipment-sale-common', instanceId: 'equipment-sale-common', kind: 'equipment', quality: 'common' },
  { id: 'equipment-sale-epic', instanceId: 'equipment-sale-epic', kind: 'equipment', quality: 'epic' },
  { id: 'wolf-fur', kind: 'material', quantity: 8 },
  { id: 'healing-potion', kind: 'consumable', quantity: 3 },
  { id: 'green-rune', kind: 'rune', quantity: 1 }
);
account.equipmentOwners['equipment-sale-common'] = { kind: 'bag' };
account.equipmentOwners['equipment-sale-epic'] = { kind: 'bag' };
permanent.validate(account);
const atomic = policy.applyAccountSale(account, [
  { kind: 'equipment', instanceId: 'equipment-sale-common' },
  { kind: 'material', itemId: 'wolf-fur', quantity: 3 }
], permanent);
assert.equal(atomic.proceeds, 16);
assert.equal(atomic.after, 16);
assert.equal(atomic.model.bag.items.find(item => item.id === 'wolf-fur').quantity, 5);
assert.equal(atomic.model.bag.items.some(item => item.instanceId === 'equipment-sale-common'), false);
assert.equal(account.bag.items.find(item => item.id === 'wolf-fur').quantity, 8, 'pure sale leaves source unchanged');
assert.equal(account.bag.items.some(item => item.instanceId === 'equipment-sale-common'), true);

assert.throws(() => policy.normalizeSaleSelections([
  { kind: 'material', itemId: 'wolf-fur', quantity: 1 },
  { kind: 'material', itemId: 'wolf-fur', quantity: 1 }
]), /Duplicate/);
assert.throws(() => policy.applyAccountSale(account, [{ kind: 'material', itemId: 'healing-potion', quantity: 1 }], permanent), /not eligible/);
assert.throws(() => policy.applyAccountSale(account, [{ kind: 'material', itemId: 'green-rune', quantity: 1 }], permanent), /not eligible/);
const protectedAccount = JSON.parse(JSON.stringify(account));
protectedAccount.bag.items.find(item => item.instanceId === 'equipment-sale-epic').favorite = true;
assert.throws(() => policy.applyAccountSale(protectedAccount, [{ kind: 'equipment', instanceId: 'equipment-sale-epic' }], permanent), /Protected/);
for (const flag of ['locked', 'isLocked', 'protected', 'isProtected', 'favorite', 'isFavorite']) {
  const flagged = JSON.parse(JSON.stringify(account));
  flagged.bag.items.find(item => item.instanceId === 'equipment-sale-epic')[flag] = true;
  assert.throws(() => policy.applyAccountSale(flagged, [{ kind: 'equipment', instanceId: 'equipment-sale-epic' }], permanent), /Protected/, flag + ' blocks sale');
}
const wholeStack = policy.applyAccountSale(account, [{ kind: 'material', itemId: 'wolf-fur', quantity: 8 }], permanent);
assert.equal(wholeStack.model.bag.items.some(item => item.id === 'wolf-fur'), false, 'full stack is removed');
assert.equal(wholeStack.proceeds, 16);
assert.throws(() => policy.applyAccountSale(account, [{ kind: 'equipment', instanceId: 'missing-equipment' }], permanent), /missing|already sold/);
const equippedAccount = permanent.createEmptyModel();
const equippedItem = { id: 'equipment-worn', instanceId: 'equipment-worn', kind: 'equipment', quality: 'rare' };
equippedAccount.characters['character-worn'] = { character: { id: 'character-worn', job: 'warrior' }, progress: { level: 1, xp: 0, equipment: { weapon: equippedItem }, skillLevels: {} } };
equippedAccount.slotOrder[0] = 'character-worn';equippedAccount.activeMainId = 'character-worn';equippedAccount.parties['character-worn'] = { mainId: 'character-worn', memberIds: ['character-worn'] };
equippedAccount.equipmentOwners['equipment-worn'] = { kind: 'equipped', characterId: 'character-worn', slot: 'weapon' };
permanent.validate(equippedAccount);
assert.throws(() => policy.applyAccountSale(equippedAccount, [{ kind: 'equipment', instanceId: 'equipment-worn' }], permanent), /missing|already sold|Equipped/);

console.log('inventory-sale-policy: assertions passed');
