const assert = require('node:assert/strict');
const policy = require('../hunter-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.MARKSMAN_SKILLS.length, 4);
assert.equal(policy.BEASTMASTER_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('sniper-shot', 6), { power: 3, skillCrit: .12, armorIgnore: .12, nextBasicOnCrit: .50 });
assert.deepEqual(policy.getEffect('gale-rapid-fire', 6), { duration: 6, attackSpeed: .20, basicDamage: .12, windArrowEvery: 3, windArrowPower: .60 });
assert.equal(policy.getEffect('beast-fury', 6).petDamage, .25);
assert.equal(policy.getEffect('bloody-hunt', 6).bleedTick, .18);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('pack-summoning', level).maxPets), [2,2,2,2,2,3]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('pack-summoning', level).guardUses), [2,2,2,3,3,3]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('pack-summoning', level).guardShare), [.10,.15,.20,.20,.25,.25]);
assert.deepEqual([1,2,3,4,5,6].map(level => policy.getEffect('pack-summoning', level).guardChance), [.40,.40,.40,.40,.40,.40]);

const character = { job: 'hunter' };
const progress = { level: 45, preJobTrial: { proofTiers: [1, 2, 3] } };
assert.equal(policy.canAdvance(character, progress), true);
assert.equal(policy.advance(character, progress, 'marksman').ok, true);

const marksman = { progress: { advancedClass: 'marksman', skillLevels: { 'hunter:lethal-aim': 6, 'hunter:eagle-eye-instinct': 6 } }, skillCooldowns: { 'power-shot': 9000, 'multi-shot': 12000, 'piercing-shot': 8000, 'sniper-shot': 10000 } };
assert.deepEqual(policy.getShootingBonuses(marksman, 'sniper-shot', 1000), { criticalDamage: .18, armorIgnore: 0 });
policy.completeShootingSkill(marksman, 'sniper-shot', true, true, 1000);
assert.deepEqual(policy.getShootingBonuses(marksman, 'power-shot', 2000), { criticalDamage: .18, armorIgnore: .10 });
policy.applySniperCritical(marksman, policy.getEffect('sniper-shot', 6), true, 1000);
const basic = policy.getBasicExecution(marksman, 2000);
assert.deepEqual(basic, { sniper: .50, eagle: .20, precise: 1 });
assert.equal(policy.consumeBasic(marksman, basic, true, true, 2000), 'multi-shot');
assert.equal(marksman.skillCooldowns['multi-shot'], 11000);

policy.applyGale(marksman, policy.getEffect('gale-rapid-fire', 6), 1000);
assert.equal(policy.resolveGaleBasicHit(marksman, true, 2000), 0);
assert.equal(policy.resolveGaleBasicHit(marksman, true, 2100), 0);
assert.equal(policy.resolveGaleBasicHit(marksman, true, 2200), .60);

const beastmaster = { progress: { advancedClass: 'beastmaster', skillLevels: { 'hunter:pack-summoning': 6, 'hunter:pack-leader': 6 } }, companions: [{ id: 1 }] };
assert.equal(policy.getPetCount(beastmaster), 3);
beastmaster.maxHp = 1800;
beastmaster.companions = [policy.createPet(beastmaster, 'a', 0), policy.createPet(beastmaster, 'b', 0), policy.createPet(beastmaster, 'c', 0)];
assert.equal('currentHp' in beastmaster.companions[0], false, 'pets use guard charges rather than health');
const rolls = (...values) => { let index = 0; return () => values[index++] ?? 0; };
assert.deepEqual(policy.applyGuardDamage(beastmaster, 1000, 1000, rolls(.39, 0)), { hunterDamage: 750, petDamage: 250, livingPets: 3, triggered: true, share: .25, petId: 'a', petUsesRemaining: 2, petDied: false, reviveAt: 0 });
assert.equal(policy.applyGuardDamage(beastmaster, 1000, 1500, () => .40).triggered, false, '40% is an exclusive probability boundary');
policy.applyGuardDamage(beastmaster, 1000, 2000, rolls(.1, 0));
assert.deepEqual(policy.applyGuardDamage(beastmaster, 1000, 3000, rolls(.1, 0)), { hunterDamage: 750, petDamage: 250, livingPets: 3, triggered: true, share: .25, petId: 'a', petUsesRemaining: 0, petDied: true, reviveAt: 33000 });
assert.equal(beastmaster.companions[0].alive, false);
assert.equal(policy.applyGuardDamage(beastmaster, 1000, 4000, rolls(.1, 0)).petId, 'b', 'dead pets cannot guard');
policy.updatePetSurvival(beastmaster, 33000);
assert.equal(beastmaster.companions[0].alive, true);
assert.equal(beastmaster.companions[0].currentGuardUses, 3, 'revived pets return with full guard uses');
const noPets = { companions: [] };
assert.deepEqual(policy.applyGuardDamage(noPets, 1000), { hunterDamage: 1000, petDamage: 0, livingPets: 0, triggered: false, share: 0, petId: null, petUsesRemaining: 0, petDied: false, reviveAt: 0 });
const targetState = { stunnedUntil: 0, packStunReadyAt: 0 };
assert.equal(policy.tryStun(beastmaster, targetState, true, () => .09, 1000), true);
assert.equal(policy.tryStun(beastmaster, targetState, true, () => 0, 2000), false, 'pack stun has a target-owned five-second ICD');
assert.equal(policy.tryStun(beastmaster, targetState, true, () => 0, 6000), true);

console.log('hunter-advancement-policy: assertions passed');
