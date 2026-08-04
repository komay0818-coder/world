const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');

function seeded(seed = 1) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000);
}
function stackedItem(item, quantity = 999) { return { ...item, quantity }; }
function progressWith(recipeIds, quantity = 999, gold = 99999) {
  const recipeItems = recipeIds.map((recipeId) => stackedItem(Object.values(require('../chapter-one-recipe-drop-policy.js').RECIPES).find((entry) => entry.recipeId === recipeId), quantity));
  return { gold, inventory: [...Object.values(CraftingPolicy.MATERIALS).map((item) => stackedItem(item, quantity)), ...recipeItems], equipment: {} };
}
function assertValidBatch(recipeId, expectedFixed, expectedRandom, seed) {
  const progress = progressWith([recipeId]);
  const items = Array.from({ length: 10 }, (_, index) => {
    const result = CraftingPolicy.craftEquipment(progress, recipeId, { workshopLevel: 1, random: seeded(seed + index), instanceId: `test-${recipeId}-${index}`, craftedAt: 123 });
    assert.equal(result.ok, true, result.reason);
    return result.item;
  });
  items.forEach((item) => {
    assert.equal(item.affixSchemaVersion, 3);
    assert.equal(item.primaryStat, undefined, 'V3 crafting no longer rolls a separate floating primary stat');
    assert.equal(item.fixedAffixes.length, expectedFixed);
    assert.equal(item.randomAffixes.length, expectedRandom);
    assert.equal(item.affixes.length, expectedFixed + expectedRandom);
    const stats = item.affixes.map((entry) => entry.stat);
    assert.equal(new Set(stats).size, stats.length, 'primary and additional affixes never duplicate');
    item.affixes.forEach((entry) => assert.equal(entry.value, require('../equipment-affix-policy.js').EQUIPMENT_AFFIXES[entry.id].value));
    assert.equal(item.sourceType, 'crafted');
    assert.ok(item.instanceId);
  });
  assert.ok(new Set(items.map((item) => JSON.stringify(item.randomAffixes.map((entry) => entry.id)))).size > 1, 'one recipe can produce different combinations');
  return items;
}

const green = assertValidBatch('chapter1-green-wrist', 1, 2, 10);
assertValidBatch('chapter1-green-cloak', 1, 2, 20);
assertValidBatch('chapter1-green-shoulders', 1, 2, 30);
assertValidBatch('chapter1-high-chief-rare-wrist', 2, 3, 40);
assertValidBatch('chapter1-goblin-rare-cloak', 2, 3, 50);
assertValidBatch('chapter1-black-knight-rare-shoulders', 2, 3, 60);

assert.deepEqual(JSON.parse(JSON.stringify(green[0])), green[0], 'save/load stores final values instead of rerolling');

const recipeId = 'chapter1-green-wrist';
const recipe = CraftingPolicy.RECIPES[recipeId];
const success = progressWith([recipeId], 10, 1000);
const beforeGold = success.gold;
const beforeRecipe = CraftingPolicy.getRecipeQuantity(success, recipeId);
const beforeStone = CraftingPolicy.getItemQuantity(success.inventory, 'equipment-stone-uncommon');
const crafted = CraftingPolicy.craftEquipment(success, recipeId, { instanceId: 'atomic-success' });
assert.equal(crafted.ok, true);
assert.equal(CraftingPolicy.getRecipeQuantity(success, recipeId), beforeRecipe - 1, 'craft consumes exactly one recipe');
assert.equal(CraftingPolicy.getItemQuantity(success.inventory, 'equipment-stone-uncommon'), beforeStone - 1, 'craft consumes quality stone');
assert.equal(success.gold, beforeGold - recipe.goldCost, 'craft consumes configured gold');
assert.ok(success.inventory.includes(crafted.item), 'crafted equipment enters the existing inventory');

for (const setup of [
  { name: 'missing recipe', progress: progressWith([], 10, 1000), code: 'missing-recipe' },
  { name: 'missing quality stone', progress: progressWith([recipeId], 10, 1000), code: 'missing-quality-stone', mutate: (progress) => { progress.inventory.find((item) => item.id === 'equipment-stone-uncommon').quantity = 0; } },
  { name: 'missing map material', progress: progressWith([recipeId], 10, 1000), code: 'missing-material', mutate: (progress) => { progress.inventory.find((item) => item.id === 'iron-ore').quantity = 0; } },
  { name: 'missing gold', progress: progressWith([recipeId], 10, 0), code: 'missing-gold' }
]) {
  setup.mutate?.(setup.progress);
  const snapshot = JSON.stringify(setup.progress);
  const result = CraftingPolicy.craftEquipment(setup.progress, recipeId);
  assert.equal(result.code, setup.code, setup.name);
  assert.equal(JSON.stringify(setup.progress), snapshot, `${setup.name} deducts nothing`);
}

const full = progressWith([recipeId], 10, 1000);
while (full.inventory.length < CraftingPolicy.INVENTORY_CAPACITY) full.inventory.push({ id: `filler-${full.inventory.length}`, kind: 'material', quantity: 2 });
const fullSnapshot = JSON.stringify(full);
assert.equal(CraftingPolicy.craftEquipment(full, recipeId).code, 'inventory-full');
assert.equal(JSON.stringify(full), fullSnapshot, 'full inventory deducts nothing');

const duplicate = progressWith([recipeId], 10, 1000);
duplicate.inventory.push({ id: 'duplicate', instanceId: 'duplicate', kind: 'equipment' });
const duplicateSnapshot = JSON.stringify(duplicate);
assert.equal(CraftingPolicy.craftEquipment(duplicate, recipeId, { instanceId: 'duplicate' }).code, 'duplicate-instance');
assert.equal(JSON.stringify(duplicate), duplicateSnapshot, 'duplicate instance id deducts nothing');

assert.deepEqual(Object.values(CraftingPolicy.RARITIES).map((entry) => entry.affixCount), [3, 5, 6], 'V3 total affix counts remain configurable rarity data');
assert.equal(CraftingPolicy.RARITIES.rare.workshopLevel, 1, 'chapter one blue crafting works without workshop upgrades');

console.log('crafting-policy: assertions passed');
