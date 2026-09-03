const assert = require('node:assert/strict');
const CraftingPolicy = require('../crafting-policy.js');

const recipes = [
  ['chapter3-redrock-expedition-cloak', 'crafted-redrock-expedition-cloak', { 'vulture-hard-feather': 30, 'warpattern-cloth': 25, 'ancient-runestone': 8, 'temple-core-fragment': 5 }, { defense: 12, hp: 85, dodge: .05 }, [['maxHpPercent', 15], ['hpRegeneration', 7]], 'wasteland_resilience'],
  ['chapter3-ancient-warpattern-shoulders', 'crafted-ancient-warpattern-shoulders', { 'redrock-ore': 40, 'skullcrusher-iron-scrap': 30, 'warbeast-fang': 8, 'ancient-runestone': 6 }, { defense: 22, hp: 65, damageReduction: .03 }, [['defensePercent', 15], ['skillDamagePercent', 10]], 'surging_battle_will'],
  ['chapter3-shaman-rune-wrist', 'crafted-shaman-rune-wrist', { 'wasteland-thick-hide': 30, 'warpattern-cloth': 30, 'warbeast-fang': 6, 'ancient-runestone': 8 }, { defense: 14, hp: 48, damageBonus: .04 }, [['skillDamagePercent', 10], ['cooldownSpeedPercent', 10]], 'crafted_rune_resonance']
];

function progressFor(recipeId, gold = 55000, bonus = 0) {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  return { gold, equipment: {}, inventory: [{ ...recipe, quantity: 1 }, ...Object.entries(recipe.materials).map(([id, amount]) => ({ id, kind: 'material', quantity: amount + bonus }))] };
}

recipes.forEach(([recipeId, equipmentId, materials, baseStats, fixed, abilityId], index) => {
  const recipe = CraftingPolicy.RECIPES[recipeId];
  assert.deepEqual(recipe.materials, materials);
  assert.equal(recipe.goldCost, 55000);
  assert.equal(recipe.consumeOnCraft, true, 'existing armor recipe consumption rule remains unchanged');
  const progress = progressFor(recipeId, 60000, 2);
  const result = CraftingPolicy.craftEquipment(progress, recipeId, { workshopLevel: 3, instanceId: `epic-${index}`, craftedAt: 1, random: () => 0 });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.item.equipmentId, equipmentId);
  assert.equal(result.item.quality, 'epic');
  assert.deepEqual(result.item.baseStats, baseStats);
  assert.deepEqual(result.item.fixedAffixes.map((entry) => [entry.stat, entry.value]), fixed);
  assert.equal(result.item.randomAffixes.length, 2);
  assert.equal(result.item.affixes.length, 4, 'special ability is separate from two fixed and two random affixes');
  assert.equal(result.item.specialAbility.id, abilityId);
  assert.equal(result.item.baseStatsStatus, 'ready');
  assert.equal(result.item.affixContentStatus, 'ready');
  assert.equal(result.item.specialAbilityStatus, 'ready');
  assert.equal(result.item.maxNaturalSockets, 2);
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

const legacy = { kind: 'equipment', id: 'legacy-epic', instanceId: 'legacy-epic', recipeId: recipes[0][0], sockets: 2, socketAttempts: 1 };
const migrated = CraftingPolicy.applyCraftedEpicTemplate(legacy);
assert.equal(migrated.instanceId, 'legacy-epic');
assert.deepEqual(migrated.baseStats, recipes[0][3]);
assert.equal(migrated.fixedAffixes.length, 2);
assert.equal(migrated.randomAffixes.length, 2);
assert.equal(migrated.specialAbility.id, 'wasteland_resilience');
assert.equal(migrated.sockets, 2);
assert.equal(migrated.socketAttempts, 1);

assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 1).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 2).length, 6);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'rare').length, 3);
assert.equal(Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'epic').length, 3);
console.log('chapter-three-epic-crafting: assertions passed');
