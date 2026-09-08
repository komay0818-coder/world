const assert = require('node:assert/strict');
const policy = require('../rogue-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.POISON_ENTRY_RATIO, .75);
assert.equal(policy.ASSASSINATION_SKILLS.length, 4);
assert.equal(policy.VENOM_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('shadow-assassination', 6), { power: 3, skillCrit: .12, bleedingDamage: .20, energyCost: 20, offhandOnCrit: true });
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('shadow-assassination', level).power), [1.9,2.1,2.3,2.5,2.75,3]);
assert.equal(policy.getEffect('death-mark', 6).executeCritDamage, .35);
assert.equal(policy.getSkill('shadow-assassination').energyCost, 20);
assert.equal(policy.getSkill('death-mark').energyCost, 0);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('death-mark', level).damage), [.08,.10,.12,.14,.16,.20]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('corrosive-strike', level).duration), [5,5,6,6,7,7]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('corrosive-strike', level).cooldown), [10,10,10,9,9,9]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('corrosive-strike', level).poisonBonusPerStack), [0,.08,.10,.12,.14,.16]);
assert.equal(policy.getEffect('corrosive-strike', 6).lethalCoating, .25);
assert.equal(policy.getSkill('corrosive-strike').energyCost, 0);
assert.equal(policy.getSkill('blood-venom-rend').energyCost, 30);
assert.equal(policy.getEffect('blood-venom-rend', 6).ruptureTick, .30);
assert.equal(policy.getEffect('blood-venom-rend', 6).ruptureEntryRatio, .75);
assert.equal(policy.getEffect('blood-venom-rend', 6).ruptureDuration, 6);
assert.equal(policy.getEffect('blood-venom-rend', 6).ruptureTickInterval, 2);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('blood-venom-rend', level).ruptureTick), [.17,.19,.21,.23,.26,.30]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('venom-mastery', level).poisonDamage), [.05,.08,.10,.13,.16,.25]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('venom-mastery', level).poisonMaxStacks), [4,4,5,5,6,6]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('toxic-blood-symbiosis', level).dotDamage), [.06,.08,.10,.13,.16,.25]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('lethal-technique', level).criticalChance), [.03,.04,.05,.06,.08,.10]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('weakness-insight', level).bleedingAttack), [.03,.04,.05,.06,.08,.10]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('weakness-insight', level).bleedingAttackSpeed), [.03,.05,.07,.09,.11,.14]);
assert.deepEqual(policy.getAutoSkillPriority({ advancedClass: 'assassination' }, [
  { id: 'backstab' }, { id: 'shadow-dance' }, { id: 'poison-blade' }, { id: 'shadow-assassination' }, { id: 'death-mark' }
]).map((skill) => skill.id), ['death-mark', 'backstab', 'shadow-assassination', 'shadow-dance', 'poison-blade']);
assert.deepEqual(policy.getAutoSkillPriority({ advancedClass: 'venom' }, [
  { id: 'backstab' }, { id: 'shadow-dance' }, { id: 'poison-blade' }, { id: 'corrosive-strike' }, { id: 'blood-venom-rend' }
]).map((skill) => skill.id), ['corrosive-strike', 'poison-blade', 'backstab', 'blood-venom-rend', 'shadow-dance']);

const character = { job: 'assassin' };
const progress = { level: 45, preJobTrial: { proofTiers: [1, 2, 3] } };
assert.equal(policy.canAdvance(character, progress), true);
assert.equal(policy.advance(character, progress, 'assassination').ok, true);
assert.equal(progress.advancedClass, 'assassination');

const assassin = { id: 'rogue', progress: { advancedClass: 'assassination', skillLevels: { 'assassin:lethal-technique': 6, 'assassin:weakness-insight': 6 } }, skillCooldowns: { 'death-mark': 10000 } };
const state = {};
policy.markTarget(assassin, state, 6, 1000);
assert.deepEqual(policy.getTargetBonuses(assassin, [{ type: 'bleed', remaining: 3 }], state, .29, 'skill', 2000), { damage: .10, crit: .10, criticalDamage: .35, dotDamage: 0, defenseReduction: 0, attackSpeed: .14, basicDamage: 0 });
assert.deepEqual(policy.getTargetBonuses(assassin, [{ type: 'rupture', remaining: 3 }], {}, 1, 'basic', 2000), { damage: .10, crit: .10, criticalDamage: 0, dotDamage: 0, defenseReduction: 0, attackSpeed: .14, basicDamage: .15 });
assert.equal(policy.getTargetBonuses(assassin, [], {}, 1, 'basic', 2000).crit, .10, 'lethal technique critical chance applies without a bleeding target');
assert.equal(policy.getDeathMarkDamageMultiplier(assassin, state, 2000), 1.20);
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
assert.equal(policy.getTargetBonuses(venom, dots, {}, 1, 'dot', 1000).dotDamage, .25);
assert.equal(policy.getTargetBonuses(venom, dots, {}, 1, 'basic', 1000).defenseReduction, .06);
assert.equal(policy.getTargetDefenseReduction(dots), .06, 'toxic blood is a target debuff independent of the current attacker');
assert.equal(policy.getPoisonMaxStacks(venom), 6);
assert.equal(policy.getPoisonDamageBonus(venom, dots), .25);
const sixPoison = Array.from({ length: 6 }, () => ({ type: 'poison', remaining: 3, source: venom }));
assert.equal(policy.getPoisonDamageBonus(venom, sixPoison), .45, 'Lv6 poison erosion applies only at six stacks');
policy.applyCoating(venom, 6, 1000);
assert.deepEqual(policy.getCoatingExecution(venom, 5, 2000), { stacks: 5, maxStacks: 6, applyPoison: true, bonusPower: .8, bonusMultiplier: 1 });
assert.deepEqual(policy.getCoatingExecution(venom, 6, 2000), { stacks: 6, maxStacks: 6, applyPoison: false, bonusPower: .96, bonusMultiplier: 1.25 });
assert.equal(policy.getCoatingExecution(venom, 6, 8000), null, 'coating expires at the exact duration boundary');
const bonusTicks = policy.consumeBonusDotTicksOnCrit(venom, dots, true);
assert.equal(bonusTicks.length, 4, 'each poison layer and rupture receive one bonus tick');
assert.equal(policy.consumeBonusDotTicksOnCrit(venom, dots, true).length, 0, 'the same DoT application cannot trigger twice');
assert.equal(policy.resolvePlagueDeath(venom, sixPoison), false, 'plague spread was removed from venom mastery');

console.log('rogue-advancement-policy: assertions passed');
