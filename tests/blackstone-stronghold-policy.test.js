const assert = require('node:assert/strict');
const policy = require('../blackstone-stronghold-policy.js');

assert.equal(policy.RULES.gameplayType, 'outpost-siege');
assert.equal(policy.RULES.objectiveCount, 5);
assert.equal(policy.RULES.outpostDamageReduction, null);
assert.equal(policy.RULES.outpostShield, null);
assert.equal(policy.rollRequiredKills(() => 0), 10);
assert.equal(policy.rollRequiredKills(() => .999999), 70);
let state = policy.createState(() => 0);
for (let kill = 1; kill < 10; kill += 1) state = policy.recordMonsterKill(state);
assert.equal(state.outpostActive, false);
state = policy.recordMonsterKill(state);
assert.equal(state.outpostActive, true);
for (let outpost = 1; outpost <= 5; outpost += 1) {
  const result = policy.destroyOutpost(state, { now: 1000 * outpost, random: () => 0 });
  assert.equal(result.ok, true);
  assert.equal(result.state.enragedUntil, 1000 * outpost + 15000);
  assert.deepEqual(policy.getEnrage(result.state, 1000 * outpost), { active: true, attackBonus: .30, attackSpeedBonus: .30, remainingMs: 15000 });
  state = result.state;
  if (outpost < 5) for (let kill = 0; kill < 10; kill += 1) state = policy.recordMonsterKill(state);
}
assert.equal(state.destroyedOutposts, 5);
assert.equal(state.bossSpawned, true);
let guarantee = policy.createState(() => .999999);
for (let kill = 0; kill < 69; kill += 1) guarantee = policy.recordMonsterKill(guarantee);
assert.equal(guarantee.outpostActive, false);
guarantee = policy.recordMonsterKill(guarantee);
assert.equal(guarantee.outpostActive, true);
console.log('blackstone-stronghold-policy: assertions passed');
