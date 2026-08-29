const assert = require('node:assert/strict');
const policy = require('../assassin-offhand-policy.js');

const dagger = { weaponType: 'one-handed-dagger', attack: 10 };
const rangedDagger = { weaponType: 'one-handed-dagger', attackMin: 8, attackMax: 11 };
const sword = { weaponType: 'one-handed-sword', attack: 10 };

assert.equal(policy.isDagger(dagger), true, 'one-handed daggers are recognized as offhand daggers');
assert.equal(policy.isDagger({ series: '匕首' }), true, 'Chinese dagger series metadata is recognized');
assert.equal(policy.isDagger(sword), false, 'non-dagger one-handed weapons do not use dual-dagger rules');
assert.equal(policy.getEquippedAttack(dagger, 'weapon'), 10, 'main-hand dagger contributes 100% attack');
assert.equal(policy.getEquippedAttack(dagger, 'offhand'), 5, 'offhand dagger contributes 50% attack');
assert.equal(policy.getEquippedAttack(rangedDagger, 'offhand'), 4.75, 'offhand dagger range contributes 50% of its unrounded midpoint to character attack');
assert.equal(policy.getEquippedAttack(sword, 'offhand'), 10, 'other offhand weapons keep their existing contribution');

const normalStrike = policy.calculateOffhandStrike(
  { attack: 100, crit: .10, criticalDamageMultiplier: 1.5 },
  { offhandDamage: .10, offhandCrit: .05 },
  .50
);
assert.ok(Math.abs(normalStrike.damage - 55) < 1e-9, 'offhand damage bonus applies only to the 50% follow-up strike');
assert.equal(normalStrike.critical, false, 'offhand strike does not crit above its isolated crit chance');
assert.ok(Math.abs(normalStrike.criticalChance - .15) < 1e-9, 'offhand critical chance includes the 5% offhand-only bonus');

const criticalStrike = policy.calculateOffhandStrike(
  { attack: 100, crit: .10, criticalDamageMultiplier: 1.5 },
  { offhandDamage: .10, offhandCrit: .05 },
  .14
);
assert.ok(Math.abs(criticalStrike.damage - 82.5) < 1e-9, 'offhand critical uses the character critical multiplier after its own damage bonus');
assert.equal(criticalStrike.critical, true, 'offhand critical bonus can trigger only on the offhand strike');

console.log('assassin-offhand-policy: assertions passed');
