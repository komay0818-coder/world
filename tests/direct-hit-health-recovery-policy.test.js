const assert = require('node:assert/strict');
const recovery = require('../direct-hit-health-recovery-policy.js');
const affixes = require('../equipment-affix-policy.js');

const member = (current = 50, maximum = 100) => ({ currentHp: current, maxHp: maximum });
const resolve = (target, options = {}, roll = 0) => recovery.resolveDirectHit(target, {
  damageKind: 'enemy-direct', actualDamage: 10, recoveryPercent: .02, ...options
}, () => roll);

assert.equal(recovery.TRIGGER_CHANCE, .05);
let target = member();
assert.equal(resolve(target, {}, .049).restored, 2);
assert.equal(target.currentHp, 52);
target = member();
assert.equal(resolve(target, {}, .05).restored, 0, 'the fixed five-percent roll uses a strict upper boundary');

['dot', 'poison', 'bleed', 'burn', 'corruption', 'environment', 'self', 'reflect'].forEach((damageKind) => {
  const excluded = member();
  assert.equal(resolve(excluded, { damageKind }, 0).restored, 0, `${damageKind} is not an enemy direct hit`);
});
assert.equal(resolve(member(), { actualDamage: 0 }, 0).restored, 0, 'zero damage does not trigger');
assert.equal(resolve(member(0), {}, 0).restored, 0, 'lethal damage cannot revive the member');
assert.equal(resolve(member(), { recoveryPercent: 0 }, 0).restored, 0, 'a member without the affix is unchanged');

target = member(980, 1000);
assert.equal(resolve(target, {}, 0).restored, 20);
assert.equal(target.currentHp, 1000);
target = member(990, 1000);
assert.equal(resolve(target, {}, 0).restored, 10, 'healing is capped at maximum health');
assert.equal(target.currentHp, 1000);
target = member(1, 101);
assert.equal(resolve(target, {}, 0).restored, 3, 'percentage healing follows the existing ceil rounding rule');

target = member(500, 1000);
assert.equal(resolve(target, { recoveryPercent: .04 }, 0).restored, 40, 'two affixes retain one five-percent roll and sum recovery amount');
target = member(500, 1000);
assert.equal(resolve(target, { recoveryPercent: .06 }, 0).restored, 60, 'three affixes retain one five-percent roll and sum recovery amount');

const rolled = affixes.normalizeAffix({ id: 'direct_hit_health_recovery_percent' }, 'random', 3);
const stacked = affixes.getEquippedAffixStats({ armor: { affixes: [rolled] }, ring: { affixes: [rolled] }, necklace: { affixes: [rolled] } });
assert.equal(stacked.directHitHealthRecoveryPercent, 6);

const first = member();
const second = member();
assert.equal(resolve(first, {}, 0).triggered, true);
assert.equal(resolve(second, {}, .9).triggered, false, 'AOE targets use independent rolls');

console.log('direct-hit-health-recovery-policy: assertions passed');
