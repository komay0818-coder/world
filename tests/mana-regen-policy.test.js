const assert = require('assert');
const policy = require('../mana-regen-policy.js');

assert.equal(policy.getElapsedSeconds(2000, 1000), 1, 'elapsed regeneration time is measured in seconds');
assert.equal(policy.getElapsedSeconds(10000, 1000), 5, 'elapsed regeneration time is capped at five seconds');
assert.equal(policy.calculateRegenAmount({ maxMana: 100, elapsedSeconds: 1 }), 1, '100 maximum mana regenerates one base mana per second');
assert.equal(policy.calculateRegenAmount({ maxMana: 100, flatPerSecond: 1, elapsedSeconds: 1 }), 2, 'flat regeneration is added per second');
assert.equal(policy.calculateRegenAmount({
  maxMana: 200,
  regenMultiplier: 1.03,
  flatPerSecond: 1,
  elapsedSeconds: 2
}), 6.12, 'base multiplier and flat regeneration both scale with elapsed time');
assert.equal(policy.calculateRegenAmount({ maxMana: 100, flatPerSecond: 1, elapsedSeconds: 0 }), 0, 'reset timers do not regenerate paused time');

console.log('mana-regen-policy: assertions passed');
