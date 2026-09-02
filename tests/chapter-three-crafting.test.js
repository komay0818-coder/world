const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');

const recipes = [
  ['chapter3-redrock-refined-shoulders', 'crafted-redrock-refined-shoulders', { 'redrock-ore': 30, 'skullcrusher-iron-scrap': 18 }],
  ['chapter3-wasteland-refined-wrist', 'crafted-wasteland-refined-wrist', { 'wasteland-thick-hide': 24, 'warpattern-cloth': 18 }],
  ['chapter3-skullcrusher-warpattern-cloak', 'crafted-skullcrusher-warpattern-cloak', { 'vulture-hard-feather': 20, 'warpattern-cloth': 24 }]
];

function progressFor(recipeId, gold = 18000, materialBonus = 0) {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  return {
    gold,
    equipment: {},
    inventory: [
      { ...recipe, quantity: 1 },
      ...Object.entries(recipe.materials).map(([id, amount]) => ({ id, kind: 'material', quantity: amount + materialBonus }))
    ]
  };
}

assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 1).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 2).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'rare').length, 3);

recipes.forEach(([recipeId, equipmentId, materials], index) => {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  assert.deepEqual(recipe.materials, materials);
  assert.equal(recipe.goldCost, 18000, 'gold cost is read from recipe data');
  const progress = progressFor(recipeId, 20000, 3);
  const result = CraftingPolicy.craftEquipment(progress, recipeId, { instanceId: `chapter3-craft-${index}`, craftedAt: 1, random: () => .1 });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.item.equipmentId, equipmentId);
  assert.equal(result.item.quality, 'rare');
  assert.equal(result.item.affixChapter, 3);
  assert.equal(result.item.fixedAffixes.length, 2);
  assert.equal(result.item.randomAffixes.length, 3);
  assert.deepEqual(result.item.baseStats, {}, 'undecided chapter-three base stats remain empty');
  assert.equal(progress.gold, 2000);
  assert.equal(CraftingPolicy.getRecipeQuantity(progress, recipeId), 0);
  Object.entries(materials).forEach(([id]) => assert.equal(CraftingPolicy.getItemQuantity(progress.inventory, id), 3));
  assert.ok(progress.inventory.includes(result.item));

  const missingMaterial = progressFor(recipeId);
  missingMaterial.inventory.find((item) => item.id === Object.keys(materials)[0]).quantity -= 1;
  const materialSnapshot = JSON.stringify(missingMaterial);
  assert.equal(CraftingPolicy.craftEquipment(missingMaterial, recipeId).code, 'missing-material');
  assert.equal(JSON.stringify(missingMaterial), materialSnapshot, 'material failure is atomic');

  const missingGold = progressFor(recipeId, 17999);
  const goldSnapshot = JSON.stringify(missingGold);
  assert.equal(CraftingPolicy.craftEquipment(missingGold, recipeId).code, 'missing-gold');
  assert.equal(JSON.stringify(missingGold), goldSnapshot, 'gold failure is atomic');
});

const missingRecipe = progressFor(recipes[0][0]);
missingRecipe.inventory = missingRecipe.inventory.filter((item) => item.kind !== 'recipe');
const missingRecipeSnapshot = JSON.stringify(missingRecipe);
assert.equal(CraftingPolicy.craftEquipment(missingRecipe, recipes[0][0]).code, 'missing-recipe');
assert.equal(JSON.stringify(missingRecipe), missingRecipeSnapshot, 'recipe failure is atomic');
console.log('chapter-three-crafting: assertions passed');
