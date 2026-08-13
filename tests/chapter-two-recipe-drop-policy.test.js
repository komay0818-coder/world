const assert = require('node:assert/strict');
const policy = require('../chapter-two-recipe-drop-policy.js');

assert.equal(policy.RECIPE_DROP_RATE, .01, '沿用現有稀有配方 1% 機制');
assert.equal(Object.keys(policy.RECIPES).length, 6);
assert.deepEqual(Object.values(policy.RECIPES).map(({ equipmentSlot }) => equipmentSlot), ['cloak', 'wrist', 'shoulders', 'shoulders', 'wrist', 'cloak']);
assert.deepEqual(Object.values(policy.RECIPES).map(({ quality }) => quality), ['uncommon', 'uncommon', 'uncommon', 'rare', 'rare', 'rare']);
assert.ok(Object.values(policy.RECIPES).every((recipe) => recipe.chapter === 2 && recipe.materials === null && recipe.goldCost === null));
assert.deepEqual(Object.keys(policy.RARE_DROP_SOURCES), [
  'forestGuardianV2', 'blackstoneCenturion', 'giantSpider',
  'blackstoneStrongholdBullhornWarrior', 'altarGuard', 'corruptedBlackstoneCenturion'
]);
assert.ok(Object.values(policy.RARE_DROP_SOURCES).every((source) => source.dropRate === .01));

assert.equal(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-entrance', () => .0099)[0].name, '綠色披風製作書');
assert.deepEqual(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-entrance', () => .01), [], '邊界值不掉落');
assert.deepEqual(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-trail', () => 0), [], '配方不會在錯誤地圖掉落');

const progress = { inventory: [] };
policy.grantRecipeDrops(progress, { id: 'altarGuard', isElite: true }, 'forest-altar', { random: () => 0 });
policy.grantRecipeDrops(progress, { id: 'altarGuard', isElite: true }, 'forest-altar', { random: () => 0 });
assert.deepEqual(progress.inventory.map(({ id, quantity }) => ({ id, quantity })), [{ id: 'recipe-sturdy-guardian-wrist', quantity: 2 }]);

console.log('chapter-two-recipe-drop-policy: assertions passed');
