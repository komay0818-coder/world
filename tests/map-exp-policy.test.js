const assert = require('node:assert/strict');
const policy = require('../map-exp-policy.js');

assert.deepEqual(policy.CHAPTER_LEVEL_RANGES, { 1: [1, 15], 2: [15, 30], 3: [30, 45] }, 'chapters target Lv1–15, Lv15–30, and Lv30–45');

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
