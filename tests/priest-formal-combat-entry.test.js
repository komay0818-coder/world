'use strict';

const assert = require('node:assert/strict');
const { runCombat, listSkills } = require('../tools/formal-combat-entry.js');

const STAFF = { id: 'formal-priest-staff', slot: 'weapon', weaponType: 'two-handed-staff', attack: 24, attackMin: 22, attackMax: 26, magicPower: 16, criticalChance: .15 };
const PARTY = [
  { job: 'warrior', name: 'Tank', currentHpRatio: .25 },
  { job: 'hunter', name: 'Ranger', currentHpRatio: .45 },
  { job: 'assassin', name: 'Rogue', currentHpRatio: .55 }
];

assert.ok(listSkills('priest', 'holy-priest').some((skill) => skill.id === 'light-fountain'));
assert.ok(listSkills('priest', 'battle-priest').some((skill) => skill.id === 'holy-storm'));

const holyPartyConfig = {
  job: 'priest', advancedClass: 'holy-priest', mode: 'party-four', seconds: 35, seed: 0x5017,
  skills: { activeLv6: 'light-fountain', passiveLv6: 'prayer-of-life' }, equipment: { weapon: STAFF }, party: PARTY,
  enemy: { hp: 100000, defense: 15, attack: 8, attackSpeed: .8, evasion: 0, parry: 0 }
};
const holyParty = runCombat(holyPartyConfig);
assert.ok(holyParty.healing.effectiveHealing > 0 && holyParty.healing.rawHealing >= holyParty.healing.effectiveHealing);
assert.ok(holyParty.healing.healingBySource['light-fountain'] > 0);
assert.ok(holyParty.shield.generated > 0 && holyParty.shield.absorbed > 0);
assert.ok(holyParty.skillCasts['light-fountain'] > 0 && holyParty.skillCasts['guardian-sanctuary'] > 0);
assert.ok(holyParty.mana.spent > 0 && holyParty.mana.naturalRecovery > 0 && holyParty.mana.curve.length > 2);
assert.equal(holyParty.party.final.length, 4);
assert.ok(holyParty.party.healthCurve.length > 1 && holyParty.party.statusTimeline.length > 1);
assert.deepEqual(runCombat({ ...holyPartyConfig, entry: 'ui' }), holyParty, 'holy-priest party events must be UI/headless identical');

const shieldExpiryConfig = {
  ...holyPartyConfig, seconds: 8, seed: 0x6e,
  enemy: { hp: 100000, defense: 15, attack: .01, attackSpeed: .01, evasion: 0, parry: 0 }
};
const shieldExpiry = runCombat(shieldExpiryConfig);
assert.ok(shieldExpiry.shield.expired > 0 && shieldExpiry.shield.events.some((event) => event.type === 'expire'));
assert.deepEqual(runCombat({ ...shieldExpiryConfig, entry: 'ui' }), shieldExpiry, 'timed priest shields must expire identically');

const battlePriestConfig = {
  job: 'priest', advancedClass: 'battle-priest', mode: 'fixed-five', seconds: 35, seed: 0xba771e,
  skills: { activeLv6: 'holy-storm', passiveLv6: 'holy-faith' }, equipment: { weapon: STAFF },
  enemy: { hp: 2200, defense: 14, attack: .1, attackSpeed: .5, evasion: 0, parry: 0 }
};
const battlePriest = runCombat(battlePriestConfig);
assert.ok(battlePriest.totalDamage > 0 && battlePriest.aoeDamage > 0);
assert.ok(battlePriest.skillCasts['holy-storm'] > 0);
assert.ok(battlePriest.faith.events.some((event) => event.type === 'gain'));
assert.ok(battlePriest.healing.healingBySource.stormHealing > 0);
assert.deepEqual(runCombat({ ...battlePriestConfig, entry: 'ui' }), battlePriest, 'battle-priest five-target events must be UI/headless identical');

const bossConfig = {
  ...battlePriestConfig, mode: 'boss', maxSeconds: 180, seed: 0xb055,
  enemy: { hp: 7000, defense: 18, attack: .1, attackSpeed: .5, evasion: 0, parry: 0 }
};
const boss = runCombat(bossConfig);
assert.ok(boss.ttk > 0 && boss.final.enemyHps[0] <= 0 && boss.cycle.length > 0);
assert.deepEqual(runCombat({ ...bossConfig, entry: 'ui' }), boss, 'priest boss must be UI/headless identical');

const exhaustionConfig = {
  job: 'priest', advancedClass: 'holy-priest', mode: 'party-four', seconds: 55, seed: 0xe11,
  initialResource: 0, skills: { activeLv6: 'light-fountain', passiveLv6: 'light-echo' }, equipment: { weapon: STAFF }, party: PARTY,
  enemy: { hp: 100000, defense: 10, attack: 1, attackSpeed: .5 }
};
const exhaustion = runCombat(exhaustionConfig);
assert.equal(exhaustion.mana.initial, 0);
assert.equal(exhaustion.mana.minimum, 0);
assert.ok(exhaustion.mana.zeroDuration > 0 && exhaustion.mana.lowDuration > 0);
assert.ok(exhaustion.mana.blocked > 0 && exhaustion.mana.spent > 0, 'formal mana recovery must resume blocked skills');
assert.ok(exhaustion.combat.basicAttacks > 0, 'basic attacks continue while mana skills are blocked');
assert.deepEqual(runCombat({ ...exhaustionConfig, entry: 'ui' }), exhaustion, 'mana exhaustion must be UI/headless identical');

const afterglowConfig = {
  job: 'priest', mode: 'party-four', seconds: 30, seed: 4,
  skills: { activeLv6: 'heal', passiveLv6: 'divine-grace' }, equipment: { weapon: STAFF }, party: PARTY,
  enemy: { hp: 100000, defense: 10, attack: 3, attackSpeed: 1 }
};
const afterglow = runCombat(afterglowConfig);
assert.ok(afterglow.healing.healingBySource.afterglow > 0, 'formal delayed Lv6 healing must run through the deterministic timer queue');
assert.ok(afterglow.healing.healingBySource['divine-grace'] > 0);
assert.deepEqual(runCombat({ ...afterglowConfig, entry: 'ui' }), afterglow, 'delayed healing must be UI/headless identical');

const guardianConfig = {
  ...holyPartyConfig, seconds: 30, seed: 77, potions: 3, equipment: { chest: { id: 'formal-heavy-robe', slot: 'chest', defense: 100 } }, party: PARTY.map((ally) => ({ ...ally, currentHpRatio: .2 })),
  enemy: { hp: 100000, defense: 10, attack: 20, attackSpeed: 1 }
};
const guardian = runCombat(guardianConfig);
assert.ok(guardian.healing.guardianTriggers > 0 && guardian.healing.preventedDeaths > 0);
assert.ok(guardian.party.deaths > 0 && guardian.party.revives > 0 && guardian.party.firstDeathAtMs !== null);
assert.deepEqual(runCombat({ ...guardianConfig, entry: 'ui' }), guardian, 'fatal-hit prevention and party deaths must be UI/headless identical');

assert.throws(() => runCombat({
  ...holyPartyConfig,
  skills: { levels: { 'light-fountain': 6, 'guardian-sanctuary': 6 } }
}), /Only one active skill may be Lv6/);

console.log('priest-formal-combat-entry: assertions passed');
