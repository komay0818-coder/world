const assert = require('node:assert/strict');
const control = require('../control-effect-policy.js');
const affixes = require('../equipment-affix-policy.js');

assert.equal(control.CONTROL_RESISTANCE_CAP, .75);
assert.equal(control.ATTACK_SPEED_SLOW_CAP, .45);
assert.equal(control.getFinalControlDuration(2000, .15), 1700);
assert.equal(control.getFinalControlDuration(4000, .15), 3400);
assert.equal(control.getFinalControlDuration(5000, .15), 4250);
assert.equal(control.getFinalControlDuration(4000, 1), 1000, 'control resistance cannot grant immunity');

let player = { stunnedUntil: 0 };
let result = control.applyControlEffectToPlayer(player, { type: 'stun', baseDurationMs: 2000, controlResistancePercent: .15, now: 1000 });
assert.equal(result.durationMs, 1700);
assert.equal(player.stunnedUntil, 2700);
player.stunnedUntil = 3500;
control.applyControlEffectToPlayer(player, { type: 'stun', baseDurationMs: 1000, controlResistancePercent: .15, now: 2000 });
assert.equal(player.stunnedUntil, 3500, 'a shorter new stun cannot shorten or add to the existing stun');

player = { blackstoneAttackSpeedPenalty: 0, blackstoneAttackSpeedPenaltyUntil: 0 };
result = control.applyControlEffectToPlayer(player, { type: 'attack-speed-slow', baseDurationMs: 5000, magnitude: .20, controlResistancePercent: .15, now: 1000 });
assert.equal(result.durationMs, 4250);
assert.equal(player.blackstoneAttackSpeedPenalty, .20, 'resistance does not reduce magnitude');
assert.equal(player.blackstoneAttackSpeedPenaltyUntil, 5250);
player.blackstoneAttackSpeedPenalty = .30;
player.blackstoneAttackSpeedPenaltyUntil = 3000;
control.applyControlEffectToPlayer(player, { type: 'attack-speed-slow', baseDurationMs: 5000, magnitude: .20, controlResistancePercent: 0, now: 2000 });
assert.equal(player.blackstoneAttackSpeedPenalty, .30, 'the stronger active magnitude remains');
assert.equal(player.blackstoneAttackSpeedPenaltyUntil, 7000, 'the later expiration remains');
control.applyControlEffectToPlayer(player, { type: 'attack-speed-slow', baseDurationMs: 1000, magnitude: .90, now: 2000 });
assert.equal(player.blackstoneAttackSpeedPenalty, .45, 'the existing slow cap remains');

const rolled = affixes.normalizeAffix({ id: 'control_resistance_percent' }, 'random', 3);
assert.equal(affixes.getEquippedAffixStats({ armor: { affixes: [rolled] } }).controlResistancePercent, 15);
assert.equal(affixes.getEquippedAffixStats({ armor: { affixes: [rolled] }, ring: { affixes: [rolled] } }).controlResistancePercent, 30);

console.log('control-effect-policy: assertions passed');
