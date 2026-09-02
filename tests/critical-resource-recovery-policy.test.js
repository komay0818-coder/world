const assert = require('node:assert/strict');
const recovery = require('../critical-resource-recovery-policy.js');
const affixes = require('../equipment-affix-policy.js');

function member(current = 50, maximum = 100, resourceType = 'mana') {
  return { resourceCurrent: current, resourceMax: maximum, resourceType };
}

let target = member();
assert.deepEqual(recovery.resolveExecution(target, { attackKind: 'basic', critical: false, hadDirectHit: true, recoveryPercent: .02 }).restored, 0);
assert.equal(target.resourceCurrent, 50);
assert.equal(recovery.resolveExecution(target, { attackKind: 'basic', critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 2);
assert.equal(target.resourceCurrent, 52);

target = member();
assert.equal(recovery.resolveExecution(target, { attackKind: 'skill', critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 2);
assert.equal(recovery.resolveExecution(target, { attackKind: 'skill', critical: true, hadDirectHit: false, recoveryPercent: .02 }).restored, 0, 'an evaded execution has no qualifying direct hit');

['counter', 'offhand', 'companion', 'beast-slam', 'bleed-trigger', 'periodic', 'resonance', 'environment'].forEach((attackKind) => {
  const excluded = member();
  assert.equal(recovery.resolveExecution(excluded, { attackKind, critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 0, `${attackKind} is excluded`);
  assert.equal(excluded.resourceCurrent, 50);
});

target = member(99, 100);
assert.equal(recovery.resolveExecution(target, { attackKind: 'basic', critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 1);
assert.equal(target.resourceCurrent, 100);
assert.equal(recovery.resolveExecution(target, { attackKind: 'basic', critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 0, 'a full resource still resolves safely without overflow');

target = member(100, 250);
assert.equal(recovery.resolveExecution(target, { attackKind: 'skill', critical: true, hadDirectHit: true, recoveryPercent: .02 }).restored, 5);
target = member();
assert.equal(recovery.resolveExecution(target, { attackKind: 'skill', critical: true, hadDirectHit: true, recoveryPercent: .04 }).restored, 4, 'stacked affixes restore their summed percentage once');

['mana', 'rage', 'energy', 'arrows'].forEach((resourceType) => {
  const character = member(10, 100, resourceType);
  recovery.resolveExecution(character, { attackKind: 'basic', critical: true, hadDirectHit: true, recoveryPercent: .02 });
  assert.equal(character.resourceCurrent, 12, `${resourceType} uses the shared primary resource fields`);
});

const rolled = affixes.normalizeAffix({ id: 'critical_resource_recovery_percent' }, 'random', 3);
const stacked = affixes.getEquippedAffixStats({ weapon: { affixes: [rolled] }, ring: { affixes: [rolled] } });
assert.equal(stacked.criticalResourceRecoveryPercent, 4, 'equipment aggregation adds repeated affixes');

console.log('critical-resource-recovery-policy: assertions passed');
