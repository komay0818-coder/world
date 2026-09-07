'use strict';

const assert = require('node:assert/strict');
const { runCombat, listSkills } = require('../tools/formal-combat-entry.js');

const MAIN_DAGGER = { id: 'formal-main-dagger', slot: 'weapon', weaponType: 'one-handed-dagger', attack: 22, attackMin: 20, attackMax: 24, criticalChance: .2 };
const OFFHAND_DAGGER = { id: 'formal-offhand-dagger', slot: 'offhand', weaponType: 'one-handed-dagger', series: '匕首', attack: 18, attackMin: 16, attackMax: 20, criticalChance: .1 };

assert.ok(listSkills('assassin', 'assassination').some((skill) => skill.id === 'shadow-assassination'));
assert.ok(listSkills('assassin', 'venom').some((skill) => skill.id === 'blood-venom-rend'));

const assassinationConfig = {
  job: 'assassin', advancedClass: 'assassination', mode: 'fixed-five', seconds: 45, seed: 0xa551,
  skills: { activeLv6: 'shadow-assassination', passiveLv6: 'lethal-technique' },
  equipment: { weapon: MAIN_DAGGER, offhand: OFFHAND_DAGGER },
  enemy: { hp: 1800, defense: 12, attack: .1, attackSpeed: 1, evasion: 0, parry: 0 }
};
const assassination = runCombat(assassinationConfig);
assert.ok(assassination.totalDamage > 0 && assassination.basicDamage > 0);
assert.ok(assassination.offhandDamage > 0 && assassination.offhandAttacks > 0);
assert.ok(assassination.combat.offhandEvents.every((event) => event.trigger && Number.isInteger(event.targetIndex)));
assert.equal(assassination.combat.basicEvents.length, assassination.combat.basicAttacks, 'offhand events cannot inflate main-hand basic count');
assert.ok(assassination.bleed.damage > 0 && assassination.bleed.ticks > 0);
assert.ok(assassination.energy.spent > 0 && assassination.energy.naturalRecovery > 0);
assert.ok(assassination.combat.kills > 0 && assassination.combat.respawns > 0);
assert.ok(assassination.combat.dotEvents.some((event) => event.action === 'respawn-clear' && event.inheritedDotsCleared && event.cleanSkillState));
assert.deepEqual(runCombat({ ...assassinationConfig, entry: 'ui' }), assassination, 'five-target rogue events must be UI/headless identical');

const bossConfig = {
  ...assassinationConfig, mode: 'boss', maxSeconds: 180, seed: 0xb055,
  enemy: { hp: 7500, defense: 20, attack: .1, attackSpeed: .7, evasion: 0, parry: 0 }
};
const boss = runCombat(bossConfig);
assert.ok(boss.ttk > 0 && boss.final.enemyHps[0] <= 0);
assert.ok(boss.cycle.length > 0 && boss.skillCasts['death-mark'] > 0);
assert.deepEqual(runCombat({ ...bossConfig, entry: 'ui' }), boss, 'rogue boss must be UI/headless identical');

const exhaustionConfig = {
  ...assassinationConfig, seconds: 20, seed: 0xe11,
  initialResource: 0,
  enemy: { hp: 100000, defense: 10, attack: .05, attackSpeed: .5 }
};
const exhaustion = runCombat(exhaustionConfig);
assert.equal(exhaustion.energy.initial, 0);
assert.equal(exhaustion.energy.minimum, 0);
assert.ok(exhaustion.energy.zeroDuration > 0);
assert.ok(exhaustion.energy.blocked > 0);
assert.ok(exhaustion.energy.spent > 0, 'skills must resume after formal natural energy recovery');
assert.ok(exhaustion.combat.basicAttacks > 0, 'main-hand basics continue while energy skills are blocked');
assert.deepEqual(runCombat({ ...exhaustionConfig, entry: 'ui' }), exhaustion, 'energy exhaustion must be UI/headless identical');

const offhandConfig = {
  ...assassinationConfig, seconds: 35, seed: 0x0ff,
  skills: { activeLv6: 'shadow-dance', passiveLv6: 'dagger-mastery' },
  enemy: { hp: 100000, defense: 10, attack: .05, attackSpeed: .5 }
};
const offhand = runCombat(offhandConfig);
assert.ok(offhand.offhandAttacks >= 5);
assert.equal(offhand.energy.spent, Object.entries(offhand.skillCasts).reduce((sum, [id, casts]) => sum + ({ backstab: 35, 'shadow-dance': 60, 'poison-blade': 25 }[id] || 0) * casts, 0));
assert.deepEqual(runCombat({ ...offhandConfig, entry: 'ui' }), offhand, 'high-frequency offhand triggers must be UI/headless identical');

const venomConfig = {
  job: 'assassin', advancedClass: 'venom', mode: 'fixed-five', seconds: 40, seed: 0xd075,
  skills: { activeLv6: 'corrosive-strike', passiveLv6: 'toxic-blood-symbiosis' },
  equipment: { weapon: MAIN_DAGGER, offhand: OFFHAND_DAGGER },
  enemy: { hp: 100000, defense: 14, attack: .05, attackSpeed: .5, evasion: 0, parry: 0 }
};
const venom = runCombat(venomConfig);
assert.ok(venom.poison.damage > 0 && venom.poison.ticks > 0);
assert.equal(venom.poison.maxStacks, 3);
assert.ok(venom.poison.applications >= 3 && venom.poison.refreshes > 0);
assert.ok(venom.bleed.damage > 0 && venom.bleed.refreshes > 0);
assert.ok(venom.poison.timeline.length > 0 && venom.bleed.timeline.length > 0);
assert.deepEqual(runCombat({ ...venomConfig, entry: 'ui' }), venom, 'poison stacks, bleed refresh and tick timing must be UI/headless identical');

assert.throws(() => runCombat({
  ...venomConfig,
  skills: { levels: { 'poison-blade': 6, 'corrosive-strike': 6 } }
}), /Only one active skill may be Lv6/);

console.log('rogue-formal-combat-entry: assertions passed');
