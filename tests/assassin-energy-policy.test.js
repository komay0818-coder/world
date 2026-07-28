const assert = require('assert');
const policy = require('../assassin-energy-policy.js');

assert.equal(policy.isAssassin('assassin'), true, 'assassins use energy');
assert.equal(policy.isAssassin('mage'), false, 'mages do not use energy');
assert.deepEqual(policy.SKILL_COSTS, {
  backstab: 35,
  'shadow-dance': 60,
  'poison-blade': 25
}, 'existing assassin skill IDs use the requested energy costs');
assert.equal(policy.spendEnergy(100, 'backstab'), 65, 'backstab leaves 65 energy');
assert.equal(policy.canUseSkill(59, 'shadow-dance'), false, 'shadow dance requires 60 energy');
assert.equal(policy.canUseSkill(59, 'backstab'), true, 'lower-cost skills remain available');
assert.equal(policy.canUseSkill(25, 'poison-blade'), true, 'poison blade can be used at 25 energy');
assert.equal(policy.getRegeneratedEnergy(20, 1), 30, 'energy regenerates ten per second');
assert.equal(policy.getRegeneratedEnergy(95, 1), 100, 'energy does not exceed 100');
assert.equal(policy.clampEnergy(-1), 0, 'energy does not fall below zero');

const legacyProgress = {};
policy.normalizeProgress(legacyProgress, 1000);
assert.deepEqual([legacyProgress.energy, legacyProgress.maxEnergy], [100, 100], 'legacy saves receive default energy fields');
legacyProgress.energy = 40;
legacyProgress.energyUpdatedAt = 1000;
policy.normalizeProgress(legacyProgress, 3000);
assert.equal(legacyProgress.energy, 60, 'non-combat elapsed time regenerates energy');
const reloadedProgress = JSON.parse(JSON.stringify(legacyProgress));
policy.normalizeProgress(reloadedProgress, 3000);
assert.deepEqual(
  [reloadedProgress.energy, reloadedProgress.maxEnergy, Number.isFinite(reloadedProgress.energyUpdatedAt)],
  [60, 100, true],
  'saved energy survives serialization and reload without invalid values'
);

console.log('assassin-energy-policy: assertions passed');
