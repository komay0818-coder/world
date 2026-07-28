const assert = require('assert');
const policy = require('../warrior-resource-policy.js');

assert.equal(policy.isWarrior('warrior'), true, 'warriors use rage');
assert.equal(policy.isWarrior('priest'), false, 'other jobs do not use rage');
assert.equal(policy.gainFromAttack(0), 8, 'a successful attack grants eight rage');
assert.equal(policy.gainFromHitTaken(8), 13, 'being hit grants five rage');
assert.equal(policy.gainFromAttack(98), 100, 'rage cannot exceed one hundred');
assert.equal(policy.clampRage(-10), 0, 'rage cannot fall below zero');

console.log('warrior-resource-policy: assertions passed');
