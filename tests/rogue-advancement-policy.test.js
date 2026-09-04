const assert = require('node:assert/strict');
const policy = require('../rogue-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.ASSASSINATION_SKILLS.length, 4);
assert.equal(policy.VENOM_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('shadow-assassination', 6), { power: 2.7, skillCrit: .12, bleedingDamage: .15, offhandOnCrit: true });
assert.equal(policy.getEffect('death-mark', 6).executeCritDamage, .25);
assert.equal(policy.getEffect('corrosive-strike', 6).dotVulnerability, .08);
assert.equal(policy.getEffect('blood-venom-rend', 6).ruptureTick, .21);
assert.deepEqual(policy.getAutoSkillPriority({ advancedClass: 'assassination' }, [
  { id: 'backstab' }, { id: 'shadow-dance' }, { id: 'poison-blade' }, { id: 'shadow-assassination' }, { id: 'death-mark' }
]).map((skill) => skill.id), ['death-mark', 'backstab', 'shadow-assassination', 'shadow-dance', 'poison-blade']);
assert.deepEqual(policy.getAutoSkillPriority({ advancedClass: 'venom' }, [
  { id: 'backstab' }, { id: 'shadow-dance' }, { id: 'poison-blade' }, { id: 'corrosive-strike' }, { id: 'blood-venom-rend' }
]).map((skill) => skill.id), ['poison-blade', 'backstab', 'blood-venom-rend', 'corrosive-strike', 'shadow-dance']);

const character = { job: 'assassin' };
const progress = { level: 45, preJobTrial: { proofTiers: [1, 2, 3] } };
assert.equal(policy.canAdvance(character, progress), true);
assert.equal(policy.advance(character, progress, 'assassination').ok, true);
assert.equal(progress.advancedClass, 'assassination');

const assassin = { id: 'rogue', progress: { advancedClass: 'assassination', skillLevels: { 'assassin:lethal-technique': 6, 'assassin:weakness-insight': 6 } }, skillCooldowns: { 'death-mark': 10000 } };
const state = {};
policy.markTarget(assassin, state, 6, 1000);
assert.deepEqual(policy.getTargetBonuses(assassin, [{ type: 'bleed', remaining: 3 }], state, .29, 'skill', 2000), { damage: 0, crit: .08, criticalDamage: .40, dotDamage: 0, defenseReduction: 0 });
assert.equal(policy.getDeathMarkDamageMultiplier(assassin, state, 2000), 1.12);
assert.equal(policy.hasBleedingStatus([{ type: 'rupture', remaining: 1 }]), true);
assert.equal(policy.resolveMarkedKill(assassin, state, 3000), true);
assert.equal(assassin.skillCooldowns['death-mark'], 8000);
assert.equal(policy.resolveBackstabCrit(assassin, true, 6, 3000), true);
assert.deepEqual(policy.getBasicExecution(assassin, 4000), { damage: .20, extraOffhandChance: .20 });
policy.consumeBasic(assassin, policy.getBasicExecution(assassin, 4000), true);
assert.equal(policy.getBasicExecution(assassin, 4001), null);

const venom = { progress: { advancedClass: 'venom', skillLevels: { 'assassin:venom-mastery': 6, 'assassin:toxic-blood-symbiosis': 6, 'assassin:blood-venom-rend': 6 } } };
const dots = [{ type: 'poison', remaining: 3, nextTickAt: 3000, source: venom }, { type: 'poison', remaining: 3, nextTickAt: 3000, source: venom }, { type: 'poison', remaining: 3, nextTickAt: 3000, source: venom }, { type: 'rupture', remaining: 3, nextTickAt: 3000, source: venom }];
assert.equal(policy.poisonStacks(dots), 3);
assert.equal(policy.getTargetBonuses(venom, dots, {}, 1, 'dot', 1000).dotDamage, .15);
assert.equal(policy.getTargetBonuses(venom, dots, {}, 1, 'basic', 1000).defenseReduction, .06);
assert.equal(policy.getTargetDefenseReduction(dots), .06, 'toxic blood is a target debuff independent of the current attacker');
assert.equal(policy.extendDotsOnCrit(venom, dots, true), true);
assert.equal(dots[0].nextTickAt, 4000, 'one direct critical extends the schedule by exactly one second');
assert.equal(policy.resolvePlagueDeath(venom, dots), true);
assert.equal(policy.consumePlague(venom), true);
assert.equal(policy.consumePlague(venom), false);
assert.equal(policy.resolvePlagueDeath(venom, dots.slice(0, 2)), true, 'two poison stacks save one plague spread');
assert.equal(policy.consumePlague(venom), true);
assert.equal(policy.resolvePlagueDeath(venom, dots.slice(0, 1)), false, 'one poison stack is insufficient');

console.log('rogue-advancement-policy: assertions passed');
