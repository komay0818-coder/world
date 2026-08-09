const assert = require('node:assert/strict');
const policy = require('../black-forest-depths-policy.js');

assert.equal(policy.RULES.name, '黑森林深處');
assert.equal(policy.RULES.background, 'assets/black-forest-depths-background.png');
assert.equal(policy.RULES.enemyPoolId, 'black-forest-depths-enemies');
assert.equal(policy.RULES.bossId, 'heart-of-the-black-forest');
assert.equal(policy.RULES.implemented, false);
assert.equal(policy.RULES.level, 25);
assert.equal(policy.RULES.contentStatus, 'combat-ready');
assert.deepEqual(policy.RULES.visualDirection, { primaryEnergy: 'purple-corruption', forestSpiritEnergy: 'green-nature' });
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), ['腐化森林狼', '腐化樹妖', '黑暗孢子獸', '森林之魂', '腐化黑石百夫長', '腐化墮落德魯伊', '黑森林之心']);
assert.deepEqual(policy.getMonsterPool(), {
  normal: ['corrupted-forest-wolf', 'corrupted-treant', 'dark-spore-beast', 'forest-spirit'],
  elite: ['corrupted-blackstone-centurion', 'corrupted-fallen-druid'],
  boss: ['heart-of-the-black-forest']
});
assert.equal(policy.getMonster('forest-spirit').visualEnergy, 'green-nature');
assert.ok(policy.MONSTERS.filter((monster) => monster.id !== 'forest-spirit').every((monster) => monster.visualEnergy === 'purple-corruption'));
assert.equal(policy.getMonster('heart-of-the-black-forest').image, 'assets/heart-of-the-black-forest.png');
assert.equal(policy.getMonster('corrupted-fallen-druid').image, 'assets/corrupted-fallen-druid.png');
assert.equal(policy.getMonster('corrupted-blackstone-centurion').image, 'assets/corrupted-blackstone-centurion.png');
assert.equal(policy.getMonster('forest-spirit').image, 'assets/forest-spirit.png');
assert.equal(policy.getMonster('dark-spore-beast').image, 'assets/dark-spore-beast.png');
assert.equal(policy.getMonster('corrupted-treant').image, 'assets/corrupted-treant.png');
assert.equal(policy.getMonster('corrupted-forest-wolf').image, 'assets/corrupted-forest-wolf.png');
assert.equal(policy.MONSTERS.filter((monster) => monster.image !== null).length, 7);
assert.deepEqual(policy.getCombatPool(), {
  normal: ['depthsCorruptedForestWolf', 'corruptedTreant', 'darkSporeBeast', 'forestSpirit'],
  elite: ['corruptedBlackstoneCenturion', 'corruptedFallenDruid'],
  boss: ['heartOfTheBlackForest']
});
assert.ok(policy.MONSTERS.every((monster) => monster.level === 25 && monster.combatId !== null && monster.role !== null && monster.stats !== null
  && monster.dropTableId === null && monster.skillIds.length === 2 && monster.aiProfileId !== null && monster.implemented === false));
assert.deepEqual(policy.MONSTERS.map((monster) => monster.stats), [
  { maxHp: 650, attack: 82, defense: 35, evasion: 19, parry: 0, damageReduction: 6, attackSpeed: 1.50, xp: 82, gold: 41 },
  { maxHp: 980, attack: 76, defense: 72, evasion: 3, parry: 8, damageReduction: 18, attackSpeed: .78, xp: 88, gold: 45 },
  { maxHp: 820, attack: 88, defense: 48, evasion: 7, parry: 0, damageReduction: 10, attackSpeed: .95, xp: 92, gold: 48 },
  { maxHp: 760, attack: 72, defense: 44, evasion: 16, parry: 0, damageReduction: 8, attackSpeed: 1.10, xp: 90, gold: 50 },
  { maxHp: 2700, attack: 110, defense: 92, evasion: 4, parry: 18, damageReduction: 22, attackSpeed: .88, xp: 340, gold: 210 },
  { maxHp: 2350, attack: 116, defense: 65, evasion: 10, parry: 6, damageReduction: 14, attackSpeed: 1, xp: 360, gold: 225 },
  { maxHp: 12000, attack: 132, defense: 105, evasion: 5, parry: 12, damageReduction: 24, attackSpeed: .92, xp: 1500, gold: 900 }
]);
assert.equal(policy.rollLevel('heartOfTheBlackForest'), 25);
assert.equal(policy.rollLevel('unknown'), null);
assert.equal(policy.getCombatMonster('forestSpirit').faction, 'forest-nature');
assert.equal(policy.getCombatMonster('corruptedBlackstoneCenturion').isElite, true);
assert.equal(policy.getCombatMonster('heartOfTheBlackForest').isBoss, true);
assert.equal(policy.getCombatMonster('heartOfTheBlackForest').maxHp, 12000);
assert.equal(policy.getCombatMonster('unknown'), null);
assert.equal(policy.resolveAction('depthsCorruptedForestWolf', .10), 'depths-shadow-bite');
assert.equal(policy.resolveAction('depthsCorruptedForestWolf', .25), 'attack');
assert.equal(policy.resolveAction('forestSpirit', .10, true), 'nature-echo');
assert.equal(policy.resolveAction('forestSpirit', .10, false), 'attack');
assert.equal(policy.getDamageMultiplier('corrupted-heavy-axe'), 1.40);
assert.deepEqual(policy.getControlEffect('corrupted-root-entangle'), { attackSpeedPenalty: .20, durationMs: 4000 });
assert.deepEqual(policy.getCombatMultipliers('depthsCorruptedForestWolf', 200, 650), { attack: 1.15, attackSpeed: 1.20, defense: 1, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('corruptedTreant', 400, 980), { attack: 1, attackSpeed: 1, defense: 1.25, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('forestSpirit', 760, 760), { attack: 1, attackSpeed: 1, defense: 1, evasion: .08 });
assert.deepEqual(policy.getCombatMultipliers('corruptedBlackstoneCenturion', 2700, 2700, { aliveAllies: 3 }), { attack: 1.12, attackSpeed: 1, defense: 1, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('darkSporeBeast', 820, 820, { bossAuraActive: true }), { attack: 1.1, attackSpeed: 1, defense: 1.1, evasion: 0 });
assert.equal(policy.getBossPhase('heartOfTheBlackForest', 12000, 12000), 1);
assert.equal(policy.getBossPhase('heartOfTheBlackForest', 8000, 12000), 2);
assert.equal(policy.getBossPhase('heartOfTheBlackForest', 4000, 12000), 3);
assert.deepEqual(policy.getCombatMultipliers('heartOfTheBlackForest', 8000, 12000), { attack: 1.15, attackSpeed: 1, defense: 1, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('heartOfTheBlackForest', 4000, 12000), { attack: 1.3, attackSpeed: 1.25, defense: .85, evasion: 0 });
assert.deepEqual(policy.getCombatMultipliers('darkSporeBeast', 820, 820, { bossAuraActive: true, forestSpiritAlive: true }), { attack: 1.05, attackSpeed: 1, defense: 1.05, evasion: 0 });
assert.equal(policy.getMonster('unknown'), null);
const fs = require('node:fs');
const path = require('node:path');
const background = fs.readFileSync(path.join(__dirname, '..', policy.RULES.background));
assert.equal(background.subarray(1, 4).toString(), 'PNG', 'the black forest depths background is a PNG asset');
assert.equal(background[25], 2, 'the black forest depths background uses RGB color');
const heart = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('heart-of-the-black-forest').image));
assert.equal(heart.subarray(1, 4).toString(), 'PNG', 'the heart of the black forest is a PNG asset');
assert.equal(heart[25], 6, 'the heart of the black forest uses RGBA color with transparency');
const druid = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-fallen-druid').image));
assert.equal(druid.subarray(1, 4).toString(), 'PNG', 'the corrupted fallen druid is a PNG asset');
assert.equal(druid[25], 2, 'the corrupted fallen druid preserves the supplied RGB artwork');
const centurion = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-blackstone-centurion').image));
assert.equal(centurion.subarray(1, 4).toString(), 'PNG', 'the corrupted blackstone centurion is a PNG asset');
assert.equal(centurion[25], 2, 'the corrupted blackstone centurion preserves the supplied RGB artwork');
const spirit = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('forest-spirit').image));
assert.equal(spirit.subarray(1, 4).toString(), 'PNG', 'the forest spirit is a PNG asset');
assert.equal(spirit[25], 6, 'the forest spirit uses RGBA color with transparency');
const sporeBeast = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('dark-spore-beast').image));
assert.equal(sporeBeast.subarray(1, 4).toString(), 'PNG', 'the dark spore beast is a PNG asset');
assert.equal(sporeBeast[25], 6, 'the dark spore beast uses RGBA color with transparency');
const treant = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-treant').image));
assert.equal(treant.subarray(1, 4).toString(), 'PNG', 'the corrupted treant is a PNG asset');
assert.equal(treant[25], 2, 'the corrupted treant preserves the supplied RGB artwork');
const corruptedWolf = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('corrupted-forest-wolf').image));
assert.equal(corruptedWolf.subarray(1, 4).toString(), 'PNG', 'the depths corrupted forest wolf reuses the existing PNG asset');
assert.equal(corruptedWolf[25], 6, 'the reused corrupted forest wolf uses RGBA transparency');
assert.equal(policy.RULES.denseFogAccuracyPenalty, .15);
assert.equal(policy.RULES.denseFogUnavoidable, true);
assert.deepEqual(policy.RULES.bossAuraModifiers, { attackBonus: .10, defenseBonus: .10 });
assert.equal(policy.applyDenseFogAccuracy(1.05, 'black-forest-depths'), .90);
assert.equal(policy.applyDenseFogAccuracy(.10, 'black-forest-depths'), 0);
assert.equal(policy.applyDenseFogAccuracy(1.05, 'forest-altar'), 1.05);
const enemies = [{ id: 'boss', isBoss: true, currentHp: 100 }, { id: 'alive', currentHp: 10 }, { id: 'dead', currentHp: 0 }];
assert.deepEqual(policy.getBossAura(enemies), { active: true, affectedEnemyIds: ['alive'], weakenedByForestSpirit: false, modifiers: { attackBonus: .10, defenseBonus: .10 } });
enemies.push({ id: 'forestSpirit', currentHp: 10 });
assert.deepEqual(policy.getBossAura(enemies), { active: true, affectedEnemyIds: ['alive', 'forestSpirit'], weakenedByForestSpirit: true, modifiers: { attackBonus: .05, defenseBonus: .05 } });
enemies[0].currentHp = 0;
assert.deepEqual(policy.getBossAura(enemies), { active: false, affectedEnemyIds: [], weakenedByForestSpirit: false, modifiers: null });
console.log('black-forest-depths-policy: assertions passed');
