const assert = require('node:assert/strict');
const policy = require('../chapter-three-recipe-drop-policy.js');

assert.equal(policy.BLUE_RECIPE_DROP_RATE, .08);
assert.equal(policy.BLUE_CRAFT_GOLD_COST, 18000);
assert.deepEqual(Object.values(policy.RECIPES).filter((recipe) => recipe.quality === 'rare').map((recipe) => recipe.id), [
  'recipe-redrock-refined-shoulders',
  'recipe-wasteland-refined-wrist',
  'recipe-skullcrusher-warpattern-cloak'
]);

const cases = [
  ['canyon-warlord', 'brokenrock-canyon', 'recipe-redrock-refined-shoulders'],
  ['skullcrusher-centurion', 'bloodwar-wastes', 'recipe-wasteland-refined-wrist'],
  ['skullcrusher-heavy-guard', 'skullcrusher-war-camp', 'recipe-skullcrusher-warpattern-cloak']
];
cases.forEach(([enemyId, mapId, recipeId]) => {
  assert.equal(policy.rollRecipeDrops({ id: enemyId }, mapId, () => .079999)[0].id, recipeId);
  assert.deepEqual(policy.rollRecipeDrops({ id: enemyId }, mapId, () => .08), [], '8% upper boundary is exclusive');
  assert.deepEqual(policy.rollRecipeDrops({ id: enemyId }, 'wrong-map', () => 0), [], 'source must be defeated on its configured map');
});
['wasteland-hyena', 'skullcrusher-scout', 'redrock-giant-lizard', 'temple-guardian'].forEach((enemyId) => {
  assert.deepEqual(policy.rollRecipeDrops({ id: enemyId }, 'brokenrock-canyon', () => 0), [], `${enemyId} is not a recipe source`);
});

const repeatProgress = { inventory: [] };
policy.grantRecipeDrops(repeatProgress, { id: 'canyon-warlord' }, 'brokenrock-canyon', { random: () => 0 });
policy.grantRecipeDrops(repeatProgress, { id: 'canyon-warlord' }, 'brokenrock-canyon', { random: () => 0 });
assert.equal(repeatProgress.inventory[0].quantity, 2, 'duplicate recipes continue dropping and use the existing stack');
console.log('chapter-three-recipe-drop-policy: assertions passed');
