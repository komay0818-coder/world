const assert = require('node:assert/strict');
const policy = require('../chapter-one-recipe-drop-policy.js');

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

assert.equal(policy.RARE_RECIPE_DROP_RATE, .01);
assert.equal(Object.keys(policy.RECIPES).length, 6);
Object.values(policy.RECIPES).forEach((recipe) => {
  assert.equal(recipe.kind, 'recipe');
  assert.equal(recipe.itemType, 'recipe');
  assert.equal(recipe.consumable, true);
  assert.equal(recipe.stackable, true);
  assert.equal(recipe.consumeOnCraft, true);
  assert.equal(recipe.itemId, recipe.id);
  assert.ok(recipe.recipeId);
  assert.ok(['wrist', 'cloak', 'shoulders'].includes(recipe.equipmentSlot));
  assert.ok(['uncommon', 'rare'].includes(recipe.quality));
  assert.ok(recipe.resultEquipmentId);
  assert.deepEqual(recipe.materialRequirements, {});
});

const greenBoss = { id: 'blackstoneLeader', isBoss: true };
assert.equal(policy.rollRecipeDrops(greenBoss, 'plains-depths', sequence([0]))[0].id, 'recipe-green-wrist');
assert.equal(policy.rollRecipeDrops(greenBoss, 'plains-depths', sequence([.34]))[0].id, 'recipe-green-cloak');
assert.equal(policy.rollRecipeDrops(greenBoss, 'plains-depths', sequence([.99]))[0].id, 'recipe-green-shoulders');
assert.deepEqual(policy.rollRecipeDrops({ id: 'blackstoneLeader' }, 'plains-depths', sequence([0])), [], 'green recipes require the plains-depths boss');
assert.deepEqual(policy.rollRecipeDrops(greenBoss, 'wolf-den', sequence([0])), [], 'green recipes do not drop outside plains depths');

assert.equal(policy.rollRecipeDrops({ id: 'goblinTreasureChest' }, 'goblin-camp', sequence([.009]))[0].id, 'recipe-goblin-rare-cloak');
assert.equal(policy.rollRecipeDrops({ id: 'goblinHighChief' }, 'goblin-camp', sequence([.009]))[0].id, 'recipe-high-chief-rare-wrist');
assert.equal(policy.rollRecipeDrops({ id: 'wanderingBlackKnight' }, 'plains-depths', sequence([.009]))[0].id, 'recipe-black-knight-rare-shoulders');
assert.deepEqual(policy.rollRecipeDrops({ id: 'goblinTreasureChest' }, 'goblin-camp', sequence([.01])), [], 'rare recipe roll at one percent boundary misses');
assert.deepEqual(policy.rollRecipeDrops({ id: 'goblinHighChief' }, 'plains-depths', sequence([0])), [], 'rare recipe sources are map restricted');

const progress = { inventory: [] };
policy.grantRecipeDrops(progress, { id: 'goblinHighChief' }, 'goblin-camp', { random: sequence([0]) });
policy.grantRecipeDrops(progress, { id: 'goblinHighChief' }, 'goblin-camp', { random: sequence([0]) });
assert.equal(progress.inventory.length, 1);
assert.equal(progress.inventory[0].quantity, 2, 'duplicate recipe drops stack by item id');
assert.deepEqual(JSON.parse(JSON.stringify(progress)), progress, 'recipe metadata and stack quantity survive JSON save and load');

console.log('chapter-one-recipe-drop-policy: assertions passed');
