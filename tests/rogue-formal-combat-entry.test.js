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

const execute = runCombat({
  ...assassinationConfig, seconds: 30, seed: 0xecec,
  skills: { baseActiveLv6: 'backstab', basePassiveLv6: 'evasion', advancedActiveLv6: 'death-mark', advancedPassiveLv6: 'weakness-insight' },
  enemy: { hp: 600, defense: 20, attack: .1, attackSpeed: 1, evasion: 0, parry: 0 }
});
assert.ok(execute.combat.assassinationEvents.some((event) => event.action === 'death-mark-execute'), 'Lv6 death mark executes a surviving normal target at or below 30%');

const chain = runCombat({
  ...bossConfig, mode: 'fixed-five', seconds: 20, seed: 0xc1a1,
  skills: { baseActiveLv6: 'backstab', basePassiveLv6: 'dagger-mastery', advancedActiveLv6: 'shadow-assassination', advancedPassiveLv6: 'weakness-insight' },
  equipment: { weapon: { ...MAIN_DAGGER, criticalChance: .95 }, offhand: OFFHAND_DAGGER },
  enemy: { hp: 100000, defense: 20, attack: .1, attackSpeed: 1, evasion: 0, parry: 0 }
});
assert.ok(chain.combat.assassinationEvents.some((event) => event.action === 'shadow-reset'));
assert.ok(chain.skillCasts['shadow-assassination'] > 3, 'repeated criticals may chain multiple shadow assassinations without a hard cap');
assert.ok(chain.energy.spent < chain.skillCasts['shadow-assassination'] * 20 + chain.skillCasts.backstab * 35 + chain.skillCasts['poison-blade'] * 25 + chain.skillCasts['shadow-dance'] * 60, 'at least one chained shadow assassination is free');

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
assert.equal(offhand.energy.spent, Object.entries(offhand.skillCasts).reduce((sum, [id, casts]) => sum + ({ backstab: 35, 'shadow-dance': 60, 'poison-blade': 25, 'shadow-assassination': 20, 'death-mark': 0 }[id] || 0) * casts, 0));
assert.deepEqual(runCombat({ ...offhandConfig, entry: 'ui' }), offhand, 'high-frequency offhand triggers must be UI/headless identical');

const venomConfig = {
  job: 'assassin', advancedClass: 'venom', mode: 'fixed-five', seconds: 40, seed: 0xd075,
  skills: { activeLv6: 'corrosive-strike', passiveLv6: 'toxic-blood-symbiosis' },
  equipment: { weapon: MAIN_DAGGER, offhand: OFFHAND_DAGGER },
  enemy: { hp: 100000, defense: 14, attack: .05, attackSpeed: .5, evasion: 0, parry: 0 }
};
const venom = runCombat(venomConfig);
assert.ok(venom.poison.damage > 0 && venom.poison.ticks > 0);
assert.equal(venom.poison.maxStacks, 6);
assert.ok(venom.poison.applications >= 6);
assert.ok(venom.skillCasts['corrosive-strike'] > 0);
assert.ok((venom.skillDamage['coating-poison'] || 0) > 0);
assert.ok(venom.combat.resourceEvents.some((event) => event.type === 'spend' && event.skill === 'corrosive-strike' && event.amount === 0));
assert.ok(venom.combat.resourceEvents.some((event) => event.type === 'spend' && event.skill === 'blood-venom-rend' && event.amount === 30));
assert.ok(venom.bleed.damage > 0 && venom.bleed.refreshes > 0);
assert.ok(venom.poison.timeline.length > 0 && venom.bleed.timeline.length > 0);
assert.ok(venom.combat.dotEvents.some((event) => event.action === 'bonus-tick' && event.type === 'poison'));
assert.ok(venom.combat.dotEvents.some((event) => event.action === 'bonus-tick' && ['bleed', 'rupture'].includes(event.type)));
assert.deepEqual(runCombat({ ...venomConfig, entry: 'ui' }), venom, 'poison stacks, bleed refresh and tick timing must be UI/headless identical');

const bloodVenomConfig = {
  ...venomConfig, seconds: 45, seed: 0x8eed,
  skills: { baseActiveLv6: 'backstab', basePassiveLv6: 'dagger-mastery', advancedActiveLv6: 'blood-venom-rend', advancedPassiveLv6: 'venom-mastery' },
  enemy: { hp: 100000, defense: 8, attack: .05, attackSpeed: .5, evasion: 0, parry: 0 }
};
const bloodVenom = runCombat(bloodVenomConfig);
const bloodVenomEvents = bloodVenom.combat.dotEvents.filter((event) => event.type === 'bleed' && ['apply', 'stack-refresh'].includes(event.action));
assert.ok(bloodVenom.combat.skillEvents.filter((event) => event.skill === 'blood-venom-rend').every((event) => event.targets.length === 3), 'blood venom rend hits three living targets for one cast and one energy cost');
assert.ok(bloodVenomEvents.some((event) => event.stacks === 6), 'poisoned blood venom rend reaches six bleed layers after two casts');
assert.ok(bloodVenomEvents.some((event) => event.action === 'stack-refresh'), 'later casts add layers and refresh the shared twelve-second duration');
assert.ok(!bloodVenom.combat.dotEvents.some((event) => event.type === 'rupture' || event.action === 'transfer'), 'blood venom uses only bleed and keeps death transfer disabled');
assert.deepEqual(runCombat({ ...bloodVenomConfig, entry: 'ui' }), bloodVenom, 'stacked bleed timing must be UI/headless identical');
const bloodVenomBoss = runCombat({ ...bloodVenomConfig, mode: 'boss', maxSeconds: 180, enemy: { ...bloodVenomConfig.enemy, hp: 7500 } });
assert.ok(bloodVenomBoss.combat.skillEvents.filter((event) => event.skill === 'blood-venom-rend').every((event) => event.targets.length === 1), 'blood venom rend hits a lone boss only once');

const zeroEnergyCoating = runCombat({ ...venomConfig, seconds: 1, initialResource: 0 });
assert.equal(zeroEnergyCoating.skillCasts['corrosive-strike'], 1, 'coating may start the venom cycle at zero energy when cooldowns are ready');
assert.equal(zeroEnergyCoating.energy.spent, 0, 'zero-cost coating does not spend energy or trigger a resource refund');

assert.doesNotThrow(() => runCombat({
  ...venomConfig,
  skills: { levels: { 'poison-blade': 6, 'corrosive-strike': 6 } }
}), 'base and advancement active Lv6 slots are independent');
assert.throws(() => runCombat({
  ...venomConfig,
  skills: { levels: { 'poison-blade': 6, 'backstab': 6 } }
}), /Only one active skill may be Lv6 in base pool/);
assert.throws(() => runCombat({
  ...venomConfig,
  skills: { levels: { 'corrosive-strike': 6, 'blood-venom-rend': 6 } }
}), /Only one active skill may be Lv6 in advanced pool/);

console.log('rogue-formal-combat-entry: assertions passed');
