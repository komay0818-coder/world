const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');

function seeded(seed = 1) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000);
}
function materialInventory(quantity = 999) {
  return Object.values(CraftingPolicy.MATERIALS).map((item) => ({ ...item, quantity }));
}
function progressWith(recipeIds, quantity = 999) {
  return { inventory: materialInventory(quantity), equipment: {}, crafting: { recipes: Object.fromEntries(recipeIds.map((id) => [id, true])) } };
}
function assertValidBatch(recipeId, level, expectedAffixes, seed) {
  const progress = progressWith([recipeId]);
  const items = Array.from({ length: 10 }, (_, index) => {
    const result = CraftingPolicy.craftEquipment(progress, recipeId, { workshopLevel: level, random: seeded(seed + index), instanceId: `test-${recipeId}-${index}`, craftedAt: 123 });
    assert.equal(result.ok, true, result.reason);
    return result.item;
  });
  items.forEach((item) => {
    assert.ok(item.primaryStat);
    assert.equal(item.affixes.length, expectedAffixes);
    const stats = [item.primaryStat.stat, ...item.affixes.map((entry) => entry.stat)];
    assert.equal(new Set(stats).size, stats.length, 'primary and additional affixes never duplicate');
    assert.equal(item.sourceType, 'crafted');
    assert.ok(item.instanceId);
  });
  assert.ok(new Set(items.map((item) => JSON.stringify([item.primaryStat, item.affixes]))).size > 1, 'one recipe can produce different combinations');
  return items;
}

const green = assertValidBatch('test-wrist-uncommon', 1, 1, 10);
assertValidBatch('test-shoulders-rare', 2, 2, 30);
assertValidBatch('test-cloak-epic', 3, 3, 50);

const snapshot = JSON.stringify(green[0]);
assert.deepEqual(JSON.parse(snapshot), green[0], 'save/load stores final values instead of rerolling');

const missingRecipe = progressWith([]);
const missingRecipeInventory = JSON.stringify(missingRecipe.inventory);
assert.equal(CraftingPolicy.craftEquipment(missingRecipe, 'test-wrist-uncommon', { workshopLevel: 3 }).ok, false);
assert.equal(JSON.stringify(missingRecipe.inventory), missingRecipeInventory, 'unknown recipe deducts nothing');

const insufficient = progressWith(['test-wrist-uncommon'], 0);
const insufficientInventory = JSON.stringify(insufficient.inventory);
assert.equal(CraftingPolicy.craftEquipment(insufficient, 'test-wrist-uncommon', { workshopLevel: 3 }).ok, false);
assert.equal(JSON.stringify(insufficient.inventory), insufficientInventory, 'insufficient materials deduct nothing');

const lowWorkshop = progressWith(['test-cloak-epic']);
const lowWorkshopInventory = JSON.stringify(lowWorkshop.inventory);
assert.equal(CraftingPolicy.craftEquipment(lowWorkshop, 'test-cloak-epic', { workshopLevel: 2 }).ok, false);
assert.equal(JSON.stringify(lowWorkshop.inventory), lowWorkshopInventory, 'low workshop level deducts nothing');

const duplicateId = progressWith(['test-wrist-uncommon']);
duplicateId.inventory.push({ id: 'duplicate', instanceId: 'duplicate', kind: 'equipment' });
const duplicateInventory = JSON.stringify(duplicateId.inventory);
assert.equal(CraftingPolicy.craftEquipment(duplicateId, 'test-wrist-uncommon', { workshopLevel: 1, instanceId: 'duplicate' }).ok, false);
assert.equal(JSON.stringify(duplicateId.inventory), duplicateInventory, 'duplicate instance id deducts nothing');

assert.deepEqual(Object.keys(CraftingPolicy.RARITIES), ['uncommon', 'rare', 'epic']);
assert.deepEqual(Object.values(CraftingPolicy.RARITIES).map((entry) => entry.affixCount), [1, 2, 3], 'affix counts are configurable rarity data');
assert.deepEqual(Object.values(CraftingPolicy.RARITIES).map((entry) => entry.workshopLevel), [1, 2, 3], 'workshop gates are configurable rarity data');

console.log('crafting-policy: assertions passed');
