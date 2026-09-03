const assert = require('node:assert/strict');
const policy = require('../chapter-three-crafted-epic-ability-policy.js');

const item = (id) => ({ specialAbility: { id } });
const member = (id) => ({ alive: true, progress: { equipment: { armor: item(id) } } });

const cloak = member(policy.ABILITIES.wastelandResilience);
assert.equal(policy.getWastelandDamageReduction(cloak, 0), 0);
assert.equal(policy.resolveEnemyDirectHit(cloak, 10, 1000), 1);
assert.equal(policy.getWastelandDamageReduction(cloak, 1001), .03);
policy.resolveEnemyDirectHit(cloak, 10, 2000);
policy.resolveEnemyDirectHit(cloak, 10, 3000);
policy.resolveEnemyDirectHit(cloak, 10, 4000);
assert.equal(policy.getWastelandDamageReduction(cloak, 4001), .09, 'stacks cap at three');
assert.equal(cloak.wastelandResilienceUntil, 9000, 'the whole stack refreshes together');
assert.equal(policy.getWastelandDamageReduction(cloak, 9000), 0, 'all stacks expire together');
assert.equal(policy.resolveEnemyDirectHit(cloak, 0, 10000), 0, 'zero damage does not trigger');

const shoulders = member(policy.ABILITIES.surgingBattleWill);
let execution = policy.beginSkillExecution(shoulders, 1000);
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'skill', { execution }, 1000), 1);
policy.completeSkillExecution(shoulders, execution, 1000);
execution = policy.beginSkillExecution(shoulders, 2000);
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'skill', { execution }, 2000), 1.03);
policy.completeSkillExecution(shoulders, execution, 2000);
policy.completeSkillExecution(shoulders, policy.beginSkillExecution(shoulders, 3000), 3000);
policy.completeSkillExecution(shoulders, policy.beginSkillExecution(shoulders, 4000), 4000);
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'basic', {}, 4001), 1.09);
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'periodic', {}, 4001), 1, 'DOT is excluded');
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'basic', {}, 10000), 1, 'all stacks expire together');

const wrist = member(policy.ABILITIES.runeResonance);
const companion = policy.beginSkillExecution(wrist, 500, { eligible: false });
policy.completeSkillExecution(wrist, companion, 500);
assert.equal(wrist.craftedRuneResonanceUntil || 0, 0, 'companion skill does not acquire resonance');
const first = policy.beginSkillExecution(wrist, 1000);
assert.equal(first.runeResonancePercent, 0);
policy.completeSkillExecution(wrist, first, 1000);
const second = policy.beginSkillExecution(wrist, 2000);
assert.equal(second.runeResonancePercent, .15);
assert.equal(policy.getOutgoingDamageMultiplier(wrist, 'skill', { execution: second }, 2000), 1.15, 'one execution snapshot applies to every target');
policy.completeSkillExecution(wrist, second, 2000);
assert.equal(wrist.craftedRuneResonanceUntil, 0, 'the empowered cast does not reacquire resonance');
const third = policy.beginSkillExecution(wrist, 3000);
policy.completeSkillExecution(wrist, third, 3000);
assert.equal(wrist.craftedRuneResonanceUntil, 9000);
assert.equal(policy.beginSkillExecution(wrist, 9000).runeResonancePercent, 0, 'resonance expires at six seconds');

policy.clear(shoulders);
assert.equal(policy.getOutgoingDamageMultiplier(shoulders, 'counter', {}, 4001), 1);
console.log('chapter-three-crafted-epic-ability-policy: assertions passed');
