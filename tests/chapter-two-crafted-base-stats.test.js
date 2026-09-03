const assert = require('node:assert/strict');
const crafting = require('../crafting-policy.js');

const expected = {
  'chapter2-green-wrist': { baseStats: { defense: 7, hp: 25 }, quality: 'uncommon', fixed: [['maxHpPercent', 12]], randomCount: 2 },
  'chapter2-green-cloak': { baseStats: { defense: 5, hp: 45 }, quality: 'uncommon', fixed: [['maxHpPercent', 12]], randomCount: 2 },
  'chapter2-green-shoulders': { baseStats: { defense: 11, hp: 32 }, quality: 'uncommon', fixed: [['maxHpPercent', 12]], randomCount: 2 },
  'chapter2-blackstone-bullhorn-shoulders': { baseStats: { defense: 14, hp: 42, damageReduction: .02 }, quality: 'rare', fixed: [['maxHpPercent', 12], ['defensePercent', 12]], randomCount: 3 },
  'chapter2-sturdy-guardian-wrist': { baseStats: { defense: 8, hp: 30, damageBonus: .03 }, quality: 'rare', fixed: [['maxHpPercent', 12], ['defensePercent', 12]], randomCount: 3 },
  'chapter2-corrupted-centurion-cloak': { baseStats: { defense: 7, hp: 55, dodge: .03 }, quality: 'rare', fixed: [['maxHpPercent', 12], ['defensePercent', 12]], randomCount: 3 }
};

Object.entries(expected).forEach(([recipeId, spec], index) => {
  const item = crafting.generateCraftedEquipment(recipeId, { instanceId: `chapter-two-base-${index}`, random: () => .01 });
  assert.deepEqual(item.baseStats, spec.baseStats, `${recipeId} has the intended base stats`);
  Object.entries(spec.baseStats).forEach(([stat, value]) => assert.equal(item[stat], value, `${recipeId} exposes ${stat} to the shared equipment calculation`));
  assert.equal(item.quality, spec.quality);
  assert.deepEqual(item.fixedAffixes.map((entry) => [entry.stat, entry.value]), spec.fixed);
  assert.equal(item.randomAffixes.length, spec.randomCount);
  if (spec.quality === 'rare') assert.equal(item.randomAffixes.some((entry) => entry.id === 'defense_percent'), false);
});

assert.deepEqual(crafting.RECIPES['chapter1-green-wrist'].baseStats, { defense: 4, hp: 15 }, 'chapter-one wrist remains unchanged');
assert.deepEqual(crafting.RECIPES['chapter1-green-cloak'].baseStats, { defense: 3, hp: 30 }, 'chapter-one cloak remains unchanged');
assert.deepEqual(crafting.RECIPES['chapter1-green-shoulders'].baseStats, { defense: 7, hp: 20 }, 'chapter-one shoulders remain unchanged');
assert.ok(Object.values(crafting.RECIPES).filter((recipe) => recipe.chapter === 3 && recipe.quality === 'epic').every((recipe) => recipe.baseStatsStatus === 'ready' && Object.keys(recipe.baseStats || {}).length > 0), 'chapter-three epic base stats are finalized independently');

console.log('chapter-two-crafted-base-stats: assertions passed');
