'use strict';

const assert = require('node:assert/strict');
const { runCombat, listSkills } = require('../tools/formal-combat-entry.js');

const QUIVER = { id: 'formal-quiver', slot: 'offhand', series: '箭筒', maxArrows: 8, arrowRecoveryInterval: 1000 };
const BOW = { id: 'formal-bow', slot: 'weapon', weaponType: 'bow', attack: 22, attackMin: 20, attackMax: 24 };

assert.ok(listSkills('hunter', 'marksman').some((skill) => skill.id === 'sniper-shot'));
assert.ok(listSkills('hunter', 'beastmaster').some((skill) => skill.id === 'pack-summoning'));

const marksmanConfig = {
  job: 'hunter', advancedClass: 'marksman', mode: 'fixed-five', seconds: 40, seed: 0x48754e,
  skills: { activeLv6: 'gale-rapid-fire', passiveLv6: 'quick-reload' },
  equipment: { weapon: BOW, offhand: QUIVER },
  enemy: { hp: 800, defense: 12, attack: .15, attackSpeed: 1, evasion: 0, parry: 0 }
};
const marksman = runCombat(marksmanConfig);
assert.ok(marksman.totalDamage > 0);
assert.ok(marksman.basicDamage > 0 && marksman.combat.basicAttacks > 0);
assert.ok(marksman.activeSkillTotal > 0);
assert.ok(marksman.petDamage > 0 && marksman.petAttacks > 0);
assert.ok(marksman.extraShotDamage > 0 && marksman.extraShots > 0);
assert.ok(marksman.combat.petEvents.every((event) => ['pet-basic', 'beast-slam'].includes(event.kind)));
assert.ok(marksman.combat.extraShotEvents.every((event) => Number.isInteger(event.targetIndex)));
assert.ok(marksman.arrows.spent > 0 && marksman.arrows.recovered > 0);
assert.ok(marksman.combat.kills > 0 && marksman.combat.respawns > 0);
assert.deepEqual(runCombat({ ...marksmanConfig, entry: 'ui' }), marksman, 'five-target skill, pet and extra-shot target events must be UI/headless identical');

const beastmasterConfig = {
  job: 'hunter', advancedClass: 'beastmaster', mode: 'fixed-five', seconds: 35, seed: 0xbea57,
  skills: { activeLv6: 'beast-fury', passiveLv6: 'pack-summoning' },
  equipment: { weapon: BOW, offhand: QUIVER },
  enemy: { hp: 100000, defense: 14, attack: .2, attackSpeed: .01, evasion: 0, parry: 0 }
};
const beastmaster = runCombat(beastmasterConfig);
assert.equal(beastmaster.final.companions.length, 3);
assert.ok(beastmaster.skillCasts['beast-fury'] > 0);
assert.ok(beastmaster.skillCasts['bloody-hunt'] > 0);
assert.ok((beastmaster.skillDamage['pet-basic'] || 0) > 0);
assert.ok((beastmaster.skillDamage['pet-bite'] || 0) > 0);
assert.ok((beastmaster.skillDamage['beast-slam'] || 0) > 0);
assert.ok((beastmaster.skillDamage['pet-bleed'] || 0) > 0);

const bossConfig = {
  ...marksmanConfig, mode: 'boss', maxSeconds: 180,
  skills: { activeLv6: 'sniper-shot', passiveLv6: 'eagle-eye-instinct' },
  enemy: { hp: 7000, defense: 20, attack: .15, attackSpeed: .7, evasion: 0, parry: 0 }
};
const boss = runCombat(bossConfig);
assert.ok(boss.ttk > 0 && boss.final.enemyHps[0] <= 0);
assert.ok(boss.cycle.length > 0);
assert.ok(boss.skillCasts['sniper-shot'] > 0);
assert.deepEqual(runCombat({ ...bossConfig, entry: 'ui' }), boss, 'hunter UI timers and headless core must be identical');

const exhaustionConfig = {
  ...marksmanConfig, seconds: 18, seed: 730,
  initialResource: 0,
  equipment: { weapon: BOW, offhand: { ...QUIVER, maxArrows: 3, arrowRecoveryInterval: 5000 } },
  enemy: { hp: 100000, defense: 10, attack: .05, attackSpeed: .5 }
};
const exhaustion = runCombat(exhaustionConfig);
assert.equal(exhaustion.arrows.initial, 0);
assert.equal(exhaustion.arrows.minimum, 0);
assert.ok(exhaustion.arrows.zeroDuration > 0);
assert.ok(exhaustion.arrows.blocked > 0);
assert.ok(exhaustion.arrows.spent > 0, 'skills must resume after formal arrow recovery');
assert.ok(exhaustion.arrows.recovered > 0);
assert.deepEqual(runCombat({ ...exhaustionConfig, entry: 'ui' }), exhaustion, 'arrow exhaustion and recovery must be UI/headless identical');

const petGuardConfig = {
  ...marksmanConfig, seconds: 130, seed: 901,
  advancedClass: 'beastmaster',
  skills: { activeLv6: 'beast-fury', passiveLv6: 'pack-summoning' },
  enemy: { hp: 100000, defense: 10, attack: .05, attackSpeed: 1 }
};
const petGuard = runCombat(petGuardConfig);
assert.ok(petGuard.combat.petGuardTriggers >= 3);
assert.ok(petGuard.combat.petGuardCooldownSkips > 0);
assert.ok(petGuard.combat.petEvents.some((event) => event.kind === 'pet-death'));
assert.ok(petGuard.combat.petEvents.some((event) => event.kind === 'pet-revive'));
assert.ok(petGuard.combat.petEvents.filter((event) => event.kind === 'pet-guard').every((event, index, events) => index === 0 || event.atMs - events[index - 1].atMs >= 10000));
assert.equal(petGuard.final.hunterState.petGuardReadyAt, petGuard.combat.petEvents.filter((event) => event.kind === 'pet-guard').at(-1).guardReadyAt);
assert.ok(petGuard.final.companions.every((pet) => Number.isInteger(pet.currentGuardUses) && !('currentHp' in pet)));

assert.doesNotThrow(() => runCombat({
  ...marksmanConfig,
  skills: { levels: { 'power-shot': 6, 'gale-rapid-fire': 6 } }
}), 'base and advancement active Lv6 slots are independent');
assert.throws(() => runCombat({
  ...marksmanConfig,
  skills: { levels: { 'power-shot': 6, 'multi-shot': 6 } }
}), /Only one active skill may be Lv6 in base pool/);

console.log('hunter-formal-combat-entry: assertions passed');
