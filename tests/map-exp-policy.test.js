const assert = require('node:assert/strict');
const policy = require('../map-exp-policy.js');

assert.deepEqual(policy.CHAPTER_LEVEL_RANGES, { 1: [1, 15], 2: [15, 30], 3: [30, 45] }, 'chapters target Lv1–15, Lv15–30, and Lv30–45');

assert.deepEqual(policy.LEVEL_REQUIREMENTS, {
  1: 1052, 2: 1841, 3: 2893, 4: 4208,
  5: 7210, 6: 6057, 7: 7066, 8: 8075, 9: 5191,
  10: 6651, 11: 7317, 12: 3991, 13: 4323, 14: 4656
}, 'the approved chapter-one level requirements remain un-smoothed');
Object.entries(policy.LEVEL_REQUIREMENTS).forEach(([level, requirement]) => {
  assert.equal(policy.requiredXp(Number(level)), requirement, `Lv${level} uses the approved requirement`);
});
assert.equal(policy.requiredXp(15), 1400, 'Lv15 and later retain the existing second-chapter curve');
assert.equal(policy.requiredXp(16), 1680, 'the existing post-Lv15 exponential curve is unchanged');

const expectedMultipliers = [
  [5, 1], [6, .70], [8, .70], [9, .40], [11, .40],
  [12, .20], [14, .20], [15, .05], [30, .05]
];
expectedMultipliers.forEach(([level, expected]) => {
  assert.equal(policy.getMultiplier(level, 5), expected, `Lv${level} against a Lv5 map`);
});

assert.equal(policy.getRecommendedMaxLevel({ max: 5, monsterMax: 10 }), 10, 'monster range takes priority over region entry range');
assert.equal(policy.getRecommendedMaxLevel({ max: 25 }), 25, 'map max is the reusable fallback');
assert.equal(policy.calculate(40, 20, { monsterMax: 10 }).actualExp, 2, '10 levels over receives 5% EXP');
assert.equal(policy.calculate(4, 15, { monsterMax: 4 }).actualExp, .2, 'small rewards retain the true decay rate instead of rounding back up');
assert.equal(policy.calculate(18, 20, {}).actualExp, 18, 'maps without level metadata remain backward compatible');

[
  [1, 1], [5, 1], [6, .70], [8, .70], [9, .40], [11, .40],
  [12, .20], [14, .20], [15, .05], [30, .05]
].forEach(([level, multiplier]) => {
  assert.equal(policy.calculate(100, level, { chapter: 1, monsterMax: 4 }).multiplier, multiplier, `chapter one applies ${multiplier} at Lv${level}`);
});
assert.equal(policy.calculate(100, 10, { chapter: 1, monsterMax: 4 }).actualExp, 40, 'an older chapter-one map cannot change the character-level band');
assert.equal(policy.calculate(100, 10, { chapter: 1, monsterMax: 15 }).actualExp, 40, 'a newer chapter-one map uses the same character-level band');
assert.equal(policy.calculate(100, 15, { chapter: 1, monsterMax: 15 }).actualExp, 5, 'Lv15 remains at five percent anywhere in chapter one');
assert.equal(policy.calculate(100, 20, { chapter: 2, monsterMax: 30 }).actualExp, 100, 'chapter two does not inherit chapter-one decay');

const loadedSave = { level: 4, xp: 20000 };
while (loadedSave.xp >= policy.requiredXp(loadedSave.level)) {
  loadedSave.xp -= policy.requiredXp(loadedSave.level);
  loadedSave.level += 1;
}
assert.ok(loadedSave.level > 5 && loadedSave.xp < policy.requiredXp(loadedSave.level), 'an existing save can process consecutive level-ups with the new table');
