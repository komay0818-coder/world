const assert = require('node:assert/strict');
const policy = require('../warrior-advancement-policy.js');

assert.equal(policy.FIRST_JOB_CHANGE_LEVEL, 45);
assert.equal(policy.WEAPON_MASTER_SKILLS.length, 4);
assert.equal(policy.BERSERKER_SKILLS.length, 4);
assert.deepEqual(policy.getEffect('fatal-slash', 6), { power: 2.5, skillCrit: .12, mastery: true });
assert.equal(policy.getEffect('shield-counter', 6).counterPower, 1);
assert.equal(policy.getEffect('blood-rage', 6).killHeal, .03);
assert.equal(policy.getEffect('titans-grip', 4).offhandChance, 0, 'levels one through four do not add follow-up attacks');
assert.equal(policy.getEffect('titans-grip', 5).offhandChance, .10);
assert.equal(policy.getEffect('titans-grip', 6).offhandChance, .20);

const character = { job: 'warrior' };
const advancement = { level: 45, preJobTrial: { proofTiers: [1,2,3] } };
assert.equal(policy.canAdvance(character, advancement), true);
assert.equal(policy.advance(character, advancement, 'weapon-master').ok, true);
assert.equal(advancement.advancedClass, 'weapon-master');
assert.equal(policy.advance(character, advancement, 'berserker').code, 'already-advanced');

const twoHanded = { weaponType: 'two-handed-sword', attackMin: 60, attackMax: 80 };
const berserker = { advancedClass: 'berserker', skillLevels: { 'warrior:titans-grip': 6, 'warrior:berserker-blood': 6 }, equipment: { weapon: twoHanded, offhand: twoHanded } };
assert.equal(policy.canEquipTwoHandedOffhand(twoHanded, character, berserker), true);
assert.equal(policy.getTitanAttackContribution(twoHanded, character, berserker), 35);
assert.equal(policy.getPassiveStats(berserker, .25).damage, .18, 'only the highest berserker-blood tier applies');
assert.equal(policy.getPassiveStats(berserker, .49).damage, .12);
assert.equal(policy.getPassiveStats(berserker, .69).damage, .06);

const member = { character, progress: berserker, currentHp: 40, maxHp: 100 };
assert.equal(policy.applyBloodRage(member, 6, 1000), 4);
assert.equal(member.currentHp, 36);
member.currentHp = 1;
assert.equal(policy.applyBloodRage(member, 6, 2000), 0, 'blood rage cannot kill the user');
assert.deepEqual(policy.getBerserkerSlash(6, .25), { damageMultiplier: 1.35, armorIgnore: .20 });
assert.deepEqual(policy.getBerserkerSlash(6, .40), { damageMultiplier: 1.20, armorIgnore: 0 });

member.currentHp = 19;
assert.equal(policy.crossUnyielding(member, 21, 3000), true);
assert.equal(policy.getUnyieldingReduction(member, 4000), .20);
assert.equal(policy.crossUnyielding(member, 19, 64000), false, 'remaining under twenty percent does not retrigger');
member.currentHp = 19;
assert.equal(policy.crossUnyielding(member, 25, 64000), true, 'a new downward crossing after cooldown retriggers');

member.currentHp = 40;
assert.ok(Math.abs(policy.rollTitanStrike(member, true, true, () => .19).power - .825) < 1e-9);
assert.equal(policy.rollTitanStrike(member, true, true, () => .20), null);
assert.equal(policy.rollTitanStrike(member, false, true, () => 0), null);
assert.equal(policy.rollTitanStrike(member, true, false, () => 0), null);

const swordMaster = { progress: { advancedClass: 'weapon-master', skillLevels: { 'warrior:weapon-stance': 6 }, equipment: { weapon: { weaponType: 'one-handed-sword' } } } };
assert.equal(policy.applyWeaponStance(swordMaster, 6, 1000), true);
assert.deepEqual(policy.getRuntimeBonuses(swordMaster, 'skill', 2000), { damage: .10, attack: 0, attackSpeed: .12, crit: .12, armorPenetration: 0 });

console.log('warrior-advancement-policy: assertions passed');
