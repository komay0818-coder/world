const assert = require('node:assert/strict');
const policy = require('../salvage-policy.js');

const equipment = (id, quality, extra = {}) => ({ id, instanceId: id, kind: 'equipment', name: id, quality, rarity: quality, slot: 'wrist', ...extra });
const green = equipment('green-1', 'uncommon');
const blue = equipment('blue-1', 'rare');

assert.equal(policy.FURNACE_CONFIG.green.materialId, 'green_essence_stone');
assert.equal(policy.FURNACE_CONFIG.green.baseChance, .40);
assert.equal(policy.FURNACE_CONFIG.green.chanceCap, .80);
assert.equal(policy.FURNACE_CONFIG.blue.materialId, 'blue_essence_stone');
assert.equal(policy.FURNACE_CONFIG.blue.baseChance, .25);
assert.equal(policy.FURNACE_CONFIG.blue.chanceCap, .65);
assert.equal(policy.FURNACE_CONFIG.chanceBonusPerLevel, .05);
assert.equal(policy.getChance(green, 1), .40);
assert.equal(policy.getChance(green, 2), .45);
assert.equal(policy.getChance(green, 99), .80);
assert.equal(policy.getChance(blue, 1), .25);
assert.equal(policy.getChance(blue, 5), .45);
assert.equal(policy.getChance(blue, 99), .65);

assert.equal(policy.MATERIALS.green_essence_stone.stackable, true);
assert.equal(policy.MATERIALS.blue_essence_stone.stackable, true);
assert.equal(policy.MATERIALS.purple_essence_stone.stackable, true);
assert.equal(policy.getRule(equipment('white', 'common')), null);
assert.equal(policy.getRule(equipment('purple', 'epic')), null);

const eligibleProgress = { inventory: [green, blue, equipment('white', 'common'), equipment('purple', 'epic'), equipment('locked', 'uncommon', { locked: true }), { id: 'recipe', kind: 'recipe' }], equipment: {} };
assert.deepEqual(policy.getEligibleEquipment(eligibleProgress).map(policy.getItemId), ['green-1', 'blue-1']);
assert.equal(policy.validate({ inventory: [green], equipment: { wrist: green } }, 'green-1').code, 'equipped');
assert.equal(policy.validate({ inventory: [equipment('locked', 'rare', { isLocked: true })], equipment: {} }, 'locked').code, 'protected');
assert.equal(policy.validate({ inventory: [equipment('', 'rare', { id: '', instanceId: '' })], equipment: {} }, '').code, 'missing-id');
assert.equal(policy.validate({ inventory: [green, { ...green }], equipment: {} }, 'green-1').code, 'ambiguous-id');
assert.equal(policy.validate({ inventory: [], equipment: {} }, 'gone').code, 'missing-item');
assert.equal(policy.validate({ inventory: [equipment('white', 'common')], equipment: {} }, 'white').code, 'unsupported-quality');

const successProgress = { inventory: [green, { ...policy.MATERIALS.green_essence_stone, quantity: 2 }], equipment: {} };
const success = policy.salvage(successProgress, 'green-1', { furnaceLevel: 1, random: () => .3999 });
assert.equal(success.ok, true);
assert.equal(success.success, true);
assert.equal(success.amount, 1);
assert.equal(successProgress.inventory.some((item) => policy.getItemId(item) === 'green-1'), false, 'successful salvage consumes equipment');
assert.equal(policy.getMaterialQuantity(successProgress.inventory, 'green_essence_stone'), 3, 'reward stacks into shared inventory');

const failureProgress = { inventory: [blue], equipment: {} };
const failure = policy.salvage(failureProgress, 'blue-1', { furnaceLevel: 1, random: () => .25 });
assert.equal(failure.ok, true);
assert.equal(failure.success, false);
assert.equal(failure.amount, 0);
assert.deepEqual(failureProgress.inventory, [], 'no-stone result still consumes equipment');

const duplicateProgress = { inventory: [equipment('once', 'uncommon')], equipment: {} };
assert.equal(policy.salvage(duplicateProgress, 'once', { random: () => 0 }).ok, true);
assert.equal(policy.salvage(duplicateProgress, 'once', { random: () => 0 }).code, 'missing-item', 'same id cannot grant twice');
assert.equal(policy.getMaterialQuantity(duplicateProgress.inventory, 'green_essence_stone'), 1);

const normalized = policy.normalizeInventory([{ id: 'green_essence_stone', kind: 'material', quantity: 'bad' }]);
assert.equal(normalized[0].quantity, 0);
assert.equal(normalized[0].name, '綠色精華石');
assert.equal(policy.getMaterialQuantity([], 'blue_essence_stone'), 0, 'old saves without stones read as zero');
const migrated = policy.normalizeInventory([
  { id: 'equipment-stone-uncommon', kind: 'material', quantity: 2 },
  { ...policy.MATERIALS.green_essence_stone, quantity: 3 },
  { id: 'equipment-stone-rare', kind: 'material', quantity: 4 },
  { id: 'equipment-stone-epic', kind: 'material', quantity: 1 }
]);
assert.deepEqual(migrated.map(({ id, quantity }) => ({ id, quantity })), [
  { id: 'green_essence_stone', quantity: 5 },
  { id: 'blue_essence_stone', quantity: 4 },
  { id: 'purple_essence_stone', quantity: 1 }
], '舊存檔強化石等量併入對應精華石');

console.log('salvage-policy tests passed');
