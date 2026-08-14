const assert = require('node:assert/strict');
const policy = require('../chapter-two-recipe-drop-policy.js');

assert.equal(policy.RECIPE_DROP_RATE, .01, '沿用現有稀有配方 1% 機制');
assert.equal(Object.keys(policy.RECIPES).length, 6);
assert.deepEqual([policy.RECIPES.greenWrist.resultName, policy.RECIPES.greenCloak.resultName, policy.RECIPES.greenShoulders.resultName], ['黑森林護腕', '黑森林斗篷', '黑森林肩甲']);
assert.deepEqual(Object.values(policy.RECIPES).map(({ equipmentSlot }) => equipmentSlot), ['cloak', 'wrist', 'shoulders', 'shoulders', 'wrist', 'cloak']);
assert.deepEqual(Object.values(policy.RECIPES).map(({ quality }) => quality), ['uncommon', 'uncommon', 'uncommon', 'rare', 'rare', 'rare']);
assert.ok(Object.values(policy.RECIPES).every((recipe) => recipe.chapter === 2 && recipe.craftingStatus === 'ready'));
assert.deepEqual(policy.RECIPES.greenCloak.materials, { green_essence_stone: 1, 'black-wood': 8, 'spider-silk': 6 });
assert.deepEqual(policy.RECIPES.greenWrist.materials, { green_essence_stone: 1, 'black-iron-ore': 8, 'hard-hide': 6 });
assert.deepEqual(policy.RECIPES.greenShoulders.materials, { green_essence_stone: 1, 'black-iron-ore': 6, 'hard-hide': 6, 'spider-silk': 6 });
assert.deepEqual(policy.RECIPES.blackstoneBullhornShoulders.materials, { blue_essence_stone: 1, 'black-iron-ore': 12, 'hard-hide': 10, 'corruption-crystal': 3 });
assert.deepEqual(policy.RECIPES.sturdyGuardianWrist.materials, { blue_essence_stone: 1, 'black-iron-ore': 10, 'black-wood': 8, 'corruption-crystal': 5 });
assert.deepEqual(policy.RECIPES.corruptedCenturionCloak.materials, { blue_essence_stone: 1, 'spider-silk': 10, 'black-wood': 8, 'corruption-crystal': 6, 'venom-sac': 3 });
assert.deepEqual(Object.values(policy.RECIPES).map(({ goldCost }) => goldCost), [4800, 4800, 4800, 18000, 18000, 18000]);
Object.values(policy.RECIPES).forEach((recipe) => assert.deepEqual(recipe.materialRequirements, recipe.materials));
assert.deepEqual(Object.keys(policy.RARE_DROP_SOURCES), [
  'forestGuardianV2', 'blackstoneCenturion', 'giantSpider',
  'blackstoneStrongholdBullhornWarrior', 'altarGuard', 'corruptedBlackstoneCenturion'
]);
assert.ok(Object.values(policy.RARE_DROP_SOURCES).every((source) => source.dropRate === .01));

assert.equal(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-entrance', () => .0099)[0].name, '黑森林斗篷製作書');
assert.deepEqual(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-entrance', () => .01), [], '邊界值不掉落');
assert.deepEqual(policy.rollRecipeDrops({ id: 'forestGuardianV2', isBoss: true }, 'black-forest-trail', () => 0), [], '配方不會在錯誤地圖掉落');

const progress = { inventory: [] };
policy.grantRecipeDrops(progress, { id: 'altarGuard', isElite: true }, 'forest-altar', { random: () => 0 });
policy.grantRecipeDrops(progress, { id: 'altarGuard', isElite: true }, 'forest-altar', { random: () => 0 });
assert.deepEqual(progress.inventory.map(({ id, quantity }) => ({ id, quantity })), [{ id: 'recipe-sturdy-guardian-wrist', quantity: 2 }]);

console.log('chapter-two-recipe-drop-policy: assertions passed');
