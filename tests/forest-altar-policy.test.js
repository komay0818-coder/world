const assert = require('node:assert/strict');
const policy = require('../forest-altar-policy.js');

assert.equal(policy.MAP.id, 'forest-altar');
assert.equal(policy.MAP.name, '森林祭壇');
assert.equal(policy.MAP.level, 23);
assert.equal(policy.MAP.background, 'assets/forest-altar-background.png');
assert.equal(policy.MAP.enemyPoolId, 'forest-altar-enemies');
assert.equal(policy.MAP.bossId, 'corrupted-altar-guardian');
assert.equal(policy.MAP.implemented, false);
assert.equal(policy.MAP.contentStatus, 'skill-foundation');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '腐化森林狼', '荊棘魔藤', '腐化黑石士兵', '祭壇守衛', '腐化黑石祭司', '墮落德魯伊', '腐化祭壇守護者'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'elite', 'elite', 'elite', 'boss']);
assert.deepEqual(policy.getMonsterPool(), {
  normal: ['corrupted-forest-wolf', 'thorn-demon-vine', 'corrupted-blackstone-soldier'],
  elite: ['altar-guard', 'corrupted-blackstone-priest', 'fallen-druid'],
  boss: ['corrupted-altar-guardian']
});
assert.deepEqual(policy.getCombatPool(), {
  normal: ['corruptedForestWolf', 'thornDemonVine', 'corruptedBlackstoneSoldier'],
  elite: ['altarGuard', 'corruptedBlackstonePriest', 'fallenDruid'],
  boss: ['corruptedAltarGuardian']
});
assert.equal(policy.getMonster('fallen-druid').name, '墮落德魯伊');
assert.equal(policy.getMonster('corrupted-forest-wolf').image, 'assets/corrupted-forest-wolf.png');
assert.equal(policy.getMonster('thorn-demon-vine').image, 'assets/thorn-demon-vine.png');
assert.equal(policy.getMonster('corrupted-blackstone-soldier').image, 'assets/corrupted-blackstone-soldier.png');
assert.equal(policy.getMonster('altar-guard').image, 'assets/altar-guard.png');
assert.equal(policy.getMonster('corrupted-blackstone-priest').image, 'assets/corrupted-blackstone-priest.png');
assert.equal(policy.getMonster('fallen-druid').image, 'assets/fallen-druid.png');
assert.equal(policy.getMonster('corrupted-altar-guardian').image, 'assets/corrupted-altar-guardian.png');
assert.equal(policy.getMonster('unknown'), null);
assert.ok(policy.MONSTERS.every((monster) => monster.chapter === 2 && monster.mapId === 'forest-altar'));
assert.equal(policy.MONSTERS.filter((monster) => monster.image !== null).length, 7);
assert.ok(policy.MONSTERS.every((monster) => monster.level === 23 && monster.stats !== null
  && monster.combatId !== null && monster.role !== null && monster.dropTableId === null
  && monster.skillIds.length === 2 && monster.aiProfileId !== null && monster.implemented === false));
assert.deepEqual(policy.MONSTERS.map((monster) => monster.stats), [
  { maxHp: 480, attack: 68, defense: 30, evasion: 17, parry: 0, damageReduction: 5, attackSpeed: 1.40, xp: 65, gold: 32 },
  { maxHp: 650, attack: 59, defense: 52, evasion: 2, parry: 0, damageReduction: 12, attackSpeed: .75, xp: 68, gold: 34 },
  { maxHp: 720, attack: 65, defense: 60, evasion: 3, parry: 15, damageReduction: 15, attackSpeed: .82, xp: 72, gold: 37 },
  { maxHp: 1900, attack: 88, defense: 76, evasion: 3, parry: 10, damageReduction: 18, attackSpeed: .78, xp: 240, gold: 135 },
  { maxHp: 1450, attack: 96, defense: 48, evasion: 10, parry: 5, damageReduction: 9, attackSpeed: 1, xp: 225, gold: 145 },
  { maxHp: 1700, attack: 91, defense: 57, evasion: 8, parry: 7, damageReduction: 12, attackSpeed: .92, xp: 260, gold: 155 },
  { maxHp: 8000, attack: 108, defense: 86, evasion: 4, parry: 12, damageReduction: 20, attackSpeed: .88, xp: 950, gold: 560 }
]);
assert.equal(policy.rollLevel('corruptedForestWolf'), 23);
assert.equal(policy.rollLevel('corrupted-altar-guardian'), 23);
assert.equal(policy.rollLevel('unknown'), null);
assert.equal(policy.getCombatMonster('corruptedForestWolf').image, 'assets/corrupted-forest-wolf.png');
assert.equal(policy.getCombatMonster('corruptedBlackstoneSoldier').faction, 'corrupted-blackstone');
assert.equal(policy.getCombatMonster('altarGuard').isElite, true);
assert.equal(policy.getCombatMonster('corruptedAltarGuardian').isBoss, true);
assert.equal(policy.getCombatMonster('corruptedAltarGuardian').maxHp, 8000);
assert.deepEqual(policy.getCombatMonster('fallenDruid').skillIds, ['withering-touch', 'spreading-corruption']);
assert.equal(policy.getCombatMonster('unknown'), null);
assert.equal(policy.resolveAction('corruptedForestWolf', .10), 'corrupted-bite');
assert.equal(policy.resolveAction('corruptedForestWolf', .25), 'attack');
assert.equal(policy.resolveAction('corruptedAltarGuardian', .10), 'root-sweep');
assert.equal(policy.getDamageMultiplier('blackstone-heavy-slash'), 1.32);
assert.equal(policy.getDamageMultiplier('attack'), 1);
assert.deepEqual(policy.getControlEffect('thorn-entangle'), { attackSpeedPenalty: .20, durationMs: 4000 });
assert.equal(policy.getControlEffect('blackstone-heavy-slash'), null);
assert.deepEqual(policy.getCombatMultipliers('corruptedForestWolf', 190, 480), { attack: 1.15, attackSpeed: 1.20, defense: 1, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('thornDemonVine', 300, 650), { attack: 1, attackSpeed: 1, defense: 1.20, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('corruptedBlackstoneSoldier', 350, 720), { attack: 1, attackSpeed: 1, defense: 1.25, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('altarGuard', 1900, 1900), { attack: 1, attackSpeed: 1, defense: 1.15, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('corruptedBlackstonePriest', 500, 1450), { attack: 1.20, attackSpeed: 1, defense: .90, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('fallenDruid', 800, 1700), { attack: 1.15, attackSpeed: 1, defense: 1, evasion: 0 });
assert.equal(policy.getBossPhase('corruptedAltarGuardian', 8000, 8000), 1);
assert.equal(policy.getBossPhase('corruptedAltarGuardian', 5000, 8000), 2);
assert.equal(policy.getBossPhase('corruptedAltarGuardian', 2500, 8000), 3);
assert.deepEqual(policy.getCombatMultipliers('corruptedAltarGuardian', 2500, 8000), { attack: 1.25, attackSpeed: 1.20, defense: .90, evasion: 0 });
const fs = require('node:fs');
const path = require('node:path');
const wolf = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-forest-wolf').image));
assert.equal(wolf.subarray(1, 4).toString(), 'PNG', 'the corrupted forest wolf is a PNG asset');
assert.equal(wolf[25], 6, 'the corrupted forest wolf uses RGBA color with transparency');
const vine = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('thorn-demon-vine').image));
assert.equal(vine.subarray(1, 4).toString(), 'PNG', 'the thorn demon vine is a PNG asset');
assert.equal(vine[25], 6, 'the thorn demon vine uses RGBA color with transparency');
const soldier = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-blackstone-soldier').image));
assert.equal(soldier.subarray(1, 4).toString(), 'PNG', 'the corrupted blackstone soldier is a PNG asset');
assert.equal(soldier[25], 6, 'the corrupted blackstone soldier uses RGBA color with transparency');
const guard = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('altar-guard').image));
assert.equal(guard.subarray(1, 4).toString(), 'PNG', 'the altar guard is a PNG asset');
assert.equal(guard[25], 6, 'the altar guard uses RGBA color with transparency');
const priest = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-blackstone-priest').image));
assert.equal(priest.subarray(1, 4).toString(), 'PNG', 'the corrupted blackstone priest is a PNG asset');
assert.equal(priest[25], 6, 'the corrupted blackstone priest uses RGBA color with transparency');
const druid = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('fallen-druid').image));
assert.equal(druid.subarray(1, 4).toString(), 'PNG', 'the fallen druid is a PNG asset');
assert.equal(druid[25], 6, 'the fallen druid uses RGBA color with transparency');
const boss = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-altar-guardian').image));
assert.equal(boss.subarray(1, 4).toString(), 'PNG', 'the corrupted altar guardian is a PNG asset');
assert.equal(boss[25], 6, 'the corrupted altar guardian uses RGBA color with transparency');
const background = fs.readFileSync(path.join(__dirname, '..', policy.MAP.background));
assert.equal(background.subarray(1, 4).toString(), 'PNG', 'the forest altar background is a PNG asset');
assert.equal(background[25], 2, 'the forest altar background uses RGB color');

console.log('forest-altar-policy: assertions passed');
