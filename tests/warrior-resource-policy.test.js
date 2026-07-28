const assert = require('assert');
const policy = require('../warrior-resource-policy.js');

assert.equal(policy.isWarrior('warrior'), true, 'warriors use rage');
assert.equal(policy.isWarrior('priest'), false, 'other jobs do not use rage');
assert.equal(policy.gainFromAttack(0), 4, 'a successful attack grants four rage');
assert.equal(policy.gainFromHitTaken(4), 6.5, 'being hit grants two and a half rage');
assert.equal(policy.gainFromAttack(98), 100, 'rage cannot exceed one hundred');
assert.equal(policy.clampRage(-10), 0, 'rage cannot fall below zero');

console.log('warrior-resource-policy: assertions passed');
