const assert = require('node:assert/strict');
const policy = require('../hunter-arrow-policy.js');

assert.equal(policy.isHunter('hunter'), true, 'hunters use arrows');
assert.equal(policy.isHunter('mage'), false, 'mages do not use arrows');

const starter = policy.createStarterQuiver();
assert.equal(starter.name, '新手箭筒', 'starter quiver has the expected name');
assert.equal(starter.slot, 'offhand', 'starter quiver uses the offhand slot');
assert.equal(starter.maxArrows, 8, 'starter quiver holds eight arrows');
assert.equal(starter.arrowRecoveryInterval, 1000, 'starter quiver recovers one arrow per second');
assert.equal(policy.getRecoveryInterval({ offhand: { slot: 'offhand', maxArrows: 10, arrowRecoveryInterval: 1000, arrowRecoverySpeedBonus: .10 } }), 1000 / 1.1, 'recovery speed bonus shortens the arrow recovery interval by 10%');
assert.deepEqual(starter.allowedJobs, ['hunter'], 'starter quiver is hunter-only');

const oldEquipment = { weapon: { id: 'starter-hunter-weapon-0' }, offhand: null };
policy.ensureStarterQuiver(oldEquipment);
assert.equal(oldEquipment.offhand.name, '新手箭筒', 'old saves receive a starter quiver');
assert.equal(policy.getMaxArrows(oldEquipment), 8, 'equipped quiver provides arrow capacity');
assert.equal(policy.getRecoveryInterval(oldEquipment), 1000, 'equipped quiver provides recovery speed');

assert.equal(policy.getSkillCost('power-shot'), 2, 'power shot costs two arrows');
assert.equal(policy.getSkillCost('multi-shot'), 3, 'multi-shot costs three arrows');
assert.equal(policy.getSkillCost('companion'), 0, 'companion costs no arrows');
assert.equal(policy.getSkillCost('unknown-skill'), null, 'unknown skills do not invent an arrow cost');
assert.equal(policy.canUseSkill(2, 'power-shot', oldEquipment), true, 'a skill can fire with enough arrows');
assert.equal(policy.canUseSkill(1, 'power-shot', oldEquipment), false, 'an unaffordable skill is skipped');
assert.equal(policy.spendArrows(2, 'power-shot', oldEquipment), 0, 'an affordable skill spends its arrows');
assert.equal(policy.spendArrows(1, 'power-shot', oldEquipment), null, 'an unaffordable skill spends nothing');
assert.equal(policy.spendArrows(0, 'companion', oldEquipment), 0, 'companion remains available at zero arrows');

assert.deepEqual(
  policy.recoverArrows(2, 2500, oldEquipment),
  { arrows: 4, recovered: 2, remainder: 500 },
  'recovery respects whole intervals and preserves partial elapsed time'
);
assert.equal(policy.recoverArrows(7, 5000, oldEquipment).arrows, 8, 'recovery cannot exceed capacity');
assert.equal(policy.clampArrows(Number.NaN, oldEquipment), 0, 'invalid arrow counts do not become NaN');

console.log('hunter-arrow-policy: assertions passed');
