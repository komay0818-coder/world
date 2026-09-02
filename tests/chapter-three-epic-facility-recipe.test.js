const assert = require('node:assert/strict');
const recipePolicy = require('../chapter-three-recipe-drop-policy.js');
const mapPolicy = require('../chapter-three-map-policy.js');

assert.equal(recipePolicy.EPIC_FACILITY_RECIPE_DROP_RATE, .02);
assert.equal(recipePolicy.EPIC_CRAFT_GOLD_COST, 55000);
const facilities = [
  ['supply-station', 'recipe-redrock-expedition-cloak'],
  ['armory', 'recipe-ancient-warpattern-shoulders'],
  ['shaman-altar', 'recipe-shaman-rune-wrist']
];

facilities.forEach(([facilityId, recipeId]) => {
  assert.equal(recipePolicy.rollFacilityRecipeDrop(facilityId, () => .019999)[0].id, recipeId);
  assert.deepEqual(recipePolicy.rollFacilityRecipeDrop(facilityId, () => .02), [], '2% upper boundary is exclusive');
  const normalRewards = [{ id: `normal-${facilityId}`, quantity: 1 }];
  const progress = { inventory: [] };
  const reward = recipePolicy.grantFacilityRewards(progress, facilityId, normalRewards, { random: () => 0 });
  assert.equal(reward.normalRewards, normalRewards, 'normal facility rewards are preserved by identity');
  assert.equal(reward.recipeDrops[0].id, recipeId);
  assert.equal(progress.inventory[0].id, recipeId);
  facilities.filter(([otherId]) => otherId !== facilityId).forEach(([otherId, otherRecipeId]) => {
    assert.notEqual(recipePolicy.rollFacilityRecipeDrop(facilityId, () => 0)[0].id, otherRecipeId, `${facilityId} cannot drop ${otherId}'s recipe`);
  });
});

let facilityProgress = mapPolicy.normalizeFacilityProgress();
facilityProgress = mapPolicy.recordFacilityDestroyed(facilityProgress, 'bloodwar-wastes', 'supply-station', 27);
assert.deepEqual(mapPolicy.getFacilityStatus(facilityProgress, 'bloodwar-wastes', 'supply-station'), { count: 27, required: 20, complete: true });
const afterTarget = recipePolicy.grantFacilityRewards({ inventory: [] }, 'supply-station', ['normal'], { random: () => 0 });
assert.equal(afterTarget.recipeDrops[0].id, 'recipe-redrock-expedition-cloak', 'completed suppression progress does not gate recipe drops');
assert.deepEqual(afterTarget.normalRewards, ['normal']);
console.log('chapter-three-epic-facility-recipe: assertions passed');
