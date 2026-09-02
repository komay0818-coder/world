const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');

const recipes = [
  ['chapter3-redrock-expedition-cloak', 'crafted-redrock-expedition-cloak', { 'vulture-hard-feather': 30, 'warpattern-cloth': 25, 'ancient-runestone': 8, 'temple-core-fragment': 5 }],
  ['chapter3-ancient-warpattern-shoulders', 'crafted-ancient-warpattern-shoulders', { 'redrock-ore': 40, 'skullcrusher-iron-scrap': 30, 'warbeast-fang': 8, 'ancient-runestone': 6 }],
  ['chapter3-shaman-rune-wrist', 'crafted-shaman-rune-wrist', { 'wasteland-thick-hide': 30, 'warpattern-cloth': 30, 'warbeast-fang': 6, 'ancient-runestone': 8 }]
];

function progressFor(recipeId, gold = 55000, bonus = 0) {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  return { gold, equipment: {}, inventory: [{ ...recipe, quantity: 1 }, ...Object.entries(recipe.materials).map(([id, amount]) => ({ id, kind: 'material', quantity: amount + bonus }))] };
}

recipes.forEach(([recipeId, equipmentId, materials], index) => {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  assert.deepEqual(recipe.materials, materials);
  assert.equal(recipe.goldCost, 55000);
  assert.equal(recipe.consumeOnCraft, true, 'existing armor recipe consumption rule remains unchanged');
  const progress = progressFor(recipeId, 60000, 2);
  const result = CraftingPolicy.craftEquipment(progress, recipeId, { workshopLevel: 3, instanceId: `epic-${index}`, craftedAt: 1, random: () => 0 });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.item.equipmentId, equipmentId);
  assert.equal(result.item.quality, 'epic');
  assert.deepEqual(result.item.baseStats, {});
  assert.deepEqual(result.item.fixedAffixes, []);
  assert.deepEqual(result.item.randomAffixes, []);
  assert.equal(result.item.specialAbility, null);
  assert.equal(result.item.baseStatsStatus, 'pending');
  assert.equal(result.item.affixContentStatus, 'pending');
  assert.equal(result.item.specialAbilityStatus, 'pending');
  assert.equal(progress.gold, 5000);
  assert.equal(CraftingPolicy.getRecipeQuantity(progress, recipeId), 0);
  Object.keys(materials).forEach((id) => assert.equal(CraftingPolicy.getItemQuantity(progress.inventory, id), 2));

  for (const setup of [
    { code: 'missing-material', progress: progressFor(recipeId), mutate: (state) => { state.inventory.find((item) => item.id === Object.keys(materials)[0]).quantity -= 1; } },
    { code: 'missing-gold', progress: progressFor(recipeId, 54999) },
    { code: 'missing-recipe', progress: progressFor(recipeId), mutate: (state) => { state.inventory = state.inventory.filter((item) => item.kind !== 'recipe'); } }
  ]) {
    setup.mutate?.(setup.progress);
    const snapshot = JSON.stringify(setup.progress);
    assert.equal(CraftingPolicy.craftEquipment(setup.progress, recipeId, { workshopLevel: 3 }).code, setup.code);
    assert.equal(JSON.stringify(setup.progress), snapshot, `${setup.code} keeps resources unchanged`);
  }
});

assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 1).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 2).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'rare').length, 3);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'epic').length, 3);
console.log('chapter-three-epic-crafting: assertions passed');
