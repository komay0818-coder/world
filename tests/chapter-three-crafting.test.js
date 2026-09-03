const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');
const EquipmentAffixPolicy = require('../equipment-affix-policy.js');

const recipes = [
  ['chapter3-redrock-refined-shoulders', 'crafted-redrock-refined-shoulders', { 'redrock-ore': 30, 'skullcrusher-iron-scrap': 18 }, { defense: 18, hp: 55, damageReduction: .03 }],
  ['chapter3-wasteland-refined-wrist', 'crafted-wasteland-refined-wrist', { 'wasteland-thick-hide': 24, 'warpattern-cloth': 18 }, { defense: 11, hp: 38, damageBonus: .04 }],
  ['chapter3-skullcrusher-warpattern-cloak', 'crafted-skullcrusher-warpattern-cloak', { 'vulture-hard-feather': 20, 'warpattern-cloth': 24 }, { defense: 9, hp: 70, dodge: .04 }]
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

recipes.forEach(([recipeId, equipmentId, materials, baseStats], index) => {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  assert.deepEqual(recipe.materials, materials);
  assert.equal(recipe.goldCost, 18000, 'gold cost is read from recipe data');
  const progress = progressFor(recipeId, 20000, 3);
  const result = CraftingPolicy.craftEquipment(progress, recipeId, { instanceId: `chapter3-craft-${index}`, craftedAt: 1, random: () => .1 });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.item.equipmentId, equipmentId);
  assert.equal(result.item.quality, 'rare');
  assert.equal(result.item.affixChapter, 3);
  assert.deepEqual(result.item.allowedJobs, [], 'chapter-three blue recipes remain all-class equipment');
  assert.equal(result.item.fixedAffixes.length, 2);
  assert.equal(result.item.randomAffixes.length, 3);
  assert.deepEqual(result.item.baseStats, baseStats);
  Object.entries(baseStats).forEach(([stat, value]) => assert.equal(result.item[stat], value, `${stat} enters the shared equipment stat path`));
  assert.deepEqual(result.item.fixedAffixes.map((entry) => [entry.stat, entry.value]), [['maxHpPercent', 15], ['defensePercent', 15]]);
  assert.equal(result.item.randomAffixes.some((entry) => entry.stat === 'defensePercent'), false, 'fixed defense component cannot roll again');
  assert.equal(result.item.affixes.length, 5, 'base stats do not consume affix slots');
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

const armorCandidateIds = EquipmentAffixPolicy.getAvailableAffixes({ kind: 'equipment', slot: 'shoulders' }, [], { chapter: 3, quality: 'rare' }).map((entry) => entry.id);
assert.equal(armorCandidateIds.includes('control_resistance_percent'), true);
assert.equal(armorCandidateIds.includes('direct_hit_health_recovery_percent'), true);
['armor_penetration_percent', 'last_stand_damage_percent', 'first_strike_damage_percent', 'critical_resource_recovery_percent'].forEach((id) => {
  assert.equal(armorCandidateIds.includes(id), false, `${id} retains its weapon/accessory restriction`);
});

const legacyAffixes = [{ id: 'max_hp_percent', value: 15 }];
const legacySockets = [{ id: 'socket-1' }];
const legacy = { kind: 'equipment', id: 'existing-instance', instanceId: 'existing-instance', recipeId: recipes[0][0], templateId: recipes[0][1], defense: 0, hp: 0, affixes: legacyAffixes, sockets: legacySockets, socketAttempts: 2 };
const migrated = CraftingPolicy.applyCraftedBaseStats(legacy);
assert.deepEqual(migrated.baseStats, recipes[0][3]);
assert.equal(migrated.instanceId, legacy.instanceId);
assert.equal(migrated.affixes, legacyAffixes, 'migration does not reroll affixes');
assert.equal(migrated.sockets, legacySockets, 'migration does not reset sockets');
assert.equal(migrated.socketAttempts, 2);

const missingRecipe = progressFor(recipes[0][0]);
missingRecipe.inventory = missingRecipe.inventory.filter((item) => item.kind !== 'recipe');
const missingRecipeSnapshot = JSON.stringify(missingRecipe);
assert.equal(CraftingPolicy.craftEquipment(missingRecipe, recipes[0][0]).code, 'missing-recipe');
assert.equal(JSON.stringify(missingRecipe), missingRecipeSnapshot, 'recipe failure is atomic');
console.log('chapter-three-crafting: assertions passed');
