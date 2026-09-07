'use strict';

const assert = require('node:assert/strict');
const { runCombat, listSkills } = require('../tools/formal-combat-entry.js');

const weaponMasterSkills = listSkills('warrior', 'weapon-master');
assert.ok(weaponMasterSkills.some((skill) => skill.id === 'heavy-strike'));
assert.ok(weaponMasterSkills.some((skill) => skill.id === 'fatal-slash'));

const common = {
  job: 'warrior', advancedClass: 'weapon-master', seed: 0x57a221,
  skills: { activeLv6: 'whirlwind', passiveLv6: 'parry' },
  equipment: { weapon: { weaponType: 'one-handed-sword', attack: 20, attackMin: 18, attackMax: 22 } },
  enemy: { hp: 700, defense: 12, attack: .2, attackSpeed: 1.2, parry: 0, evasion: 0 }
};

const five = runCombat({ ...common, mode: 'fixed-five', seconds: 30 });
assert.ok(five.totalDamage > 0);
assert.ok(five.combat.basicAttacks > 0);
assert.ok(five.combat.kills > 0);
assert.ok(five.combat.respawns > 0);
assert.ok(five.skillCasts.whirlwind > 0);
assert.ok(five.skillCasts['weapon-stance'] > 0);
assert.ok(five.aoeDamage > 0);
assert.ok(five.aoeShare > 0);
assert.ok(five.criticalRate >= 0 && five.criticalRate <= 1);
assert.ok(five.final.resource >= 0 && five.final.resource <= 100);
assert.ok(five.final.hp > 0 && five.final.hp < five.final.maxHp, 'enemy attacks must exercise warrior defense without ending the run');

const bossConfig = {
  ...common, mode: 'boss', maxSeconds: 180,
  skills: { activeLv6: 'fatal-slash', passiveLv6: 'weapon-grandmaster' },
  enemy: { hp: 6000, defense: 20, attack: .2, attackSpeed: .7, parry: 0, evasion: 0 }
};
const boss = runCombat(bossConfig);
assert.equal(boss.final.enemyHps[0] <= 0, true);
assert.ok(boss.ttk > 0);
assert.ok(boss.cycle.length > 0);
assert.ok(boss.skillCasts['fatal-slash'] > 0);

const berserker = runCombat({
  job: 'warrior', advancedClass: 'berserker', mode: 'fixed-five', seconds: 25, seed: 991,
  skills: { activeLv6: 'blood-rage', passiveLv6: 'titans-grip' },
  equipment: {
    weapon: { weaponType: 'two-handed-axe', attack: 24, attackMin: 22, attackMax: 26 },
    offhand: { weaponType: 'two-handed-axe', attack: 20, attackMin: 18, attackMax: 22 }
  },
  enemy: { hp: 900, defense: 14, attack: .2, attackSpeed: 1 }
});
assert.ok(berserker.skillCasts['blood-rage'] > 0);
assert.ok((berserker.skillDamage.offhand || 0) > 0, 'Titan Grip offhand strikes must use the formal damage resolver');

const shieldCounter = runCombat({
  job: 'warrior', advancedClass: 'weapon-master', mode: 'boss', maxSeconds: 90, seed: 1776,
  skills: { activeLv6: 'heavy-strike', passiveLv6: 'shield-counter' },
  equipment: {
    weapon: { weaponType: 'one-handed-sword', attack: 18 },
    offhand: { series: '盾牌', defense: 12, parry: .9 }
  },
  enemy: { hp: 3000, defense: 10, attack: .2, attackSpeed: 4 }
});
assert.ok((shieldCounter.skillDamage.counter || 0) > 0);
assert.ok((shieldCounter.skillDamage['shield-counter'] || 0) > 0);

const unyielding = runCombat({
  job: 'warrior', advancedClass: 'berserker', mode: 'fixed-five', seconds: 1.2, seed: 44,
  skills: { activeLv6: 'blood-rage', passiveLv6: 'berserker-blood' },
  enemy: { hp: 100000, defense: 10, attack: 32, attackSpeed: 1 }
});
assert.ok(unyielding.final.alive);
assert.ok(unyielding.final.warriorState.unyieldingUntil > 0, 'Lv6 Unyielding must trigger after crossing below 20% HP');

const ui = runCombat({ ...bossConfig, entry: 'ui' });
assert.deepEqual(ui, boss, 'UI timers and the formal headless player entry must produce identical core results');

assert.throws(() => runCombat({
  ...common,
  skills: { levels: { 'heavy-strike': 6, whirlwind: 6 } }
}), /Only one active skill may be Lv6/);

assert.throws(() => runCombat({
  ...common,
  skills: { activeLv6: 'iron-will' }
}), /Invalid active Lv6 skill/);

console.log('formal-combat-entry: assertions passed');
