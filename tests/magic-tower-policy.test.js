const assert = require('node:assert/strict');
const policy = require('../magic-tower-policy.js');

assert.deepEqual(policy.CONFIG, { fragmentCost: 10, successChance: .4, rewardAmount: 1 });
assert.deepEqual(policy.getState({}), { magicFragments: 0, magicCrystals: 0 });
assert.equal(policy.canSynthesize({ magicFragments: 9 }).ok, false);
assert.equal(policy.canSynthesize({ magicFragments: 10 }).ok, true);

const success = { magicFragments: 15, magicCrystals: 2 };
assert.equal(policy.synthesize(success, () => .3999).success, true);
assert.deepEqual(success, { magicFragments: 5, magicCrystals: 3 });

const failure = { magicFragments: 10, magicCrystals: 2 };
assert.equal(policy.synthesize(failure, () => .4).success, false);
assert.deepEqual(failure, { magicFragments: 0, magicCrystals: 2 });

const insufficient = { magicFragments: 9, magicCrystals: 1 };
assert.equal(policy.synthesize(insufficient, () => 0).ok, false);
assert.deepEqual(insufficient, { magicFragments: 9, magicCrystals: 1 });

console.log('magic-tower-policy: assertions passed');
