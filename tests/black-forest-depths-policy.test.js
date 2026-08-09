const assert = require('node:assert/strict');
const policy = require('../black-forest-depths-policy.js');

assert.equal(policy.RULES.name, '黑森林深處');
assert.equal(policy.RULES.background, 'assets/black-forest-depths-background.png');
assert.equal(policy.RULES.enemyPoolId, 'black-forest-depths-enemies');
assert.equal(policy.RULES.bossId, 'heart-of-the-black-forest');
assert.equal(policy.RULES.implemented, false);
assert.equal(policy.RULES.contentStatus, 'monster-roster');
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
assert.ok(policy.MONSTERS.every((monster) => monster.combatId === null && monster.stats === null
  && monster.dropTableId === null && monster.skillIds.length === 0 && monster.aiProfileId === null && monster.implemented === false));
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
assert.equal(policy.RULES.bossAuraModifiers, null);
assert.equal(policy.applyDenseFogAccuracy(1.05, 'black-forest-depths'), .90);
assert.equal(policy.applyDenseFogAccuracy(.10, 'black-forest-depths'), 0);
assert.equal(policy.applyDenseFogAccuracy(1.05, 'forest-altar'), 1.05);
const enemies = [{ id: 'boss', isBoss: true, currentHp: 100 }, { id: 'alive', currentHp: 10 }, { id: 'dead', currentHp: 0 }];
assert.deepEqual(policy.getBossAura(enemies), { active: true, affectedEnemyIds: ['alive'], modifiers: null });
enemies[0].currentHp = 0;
assert.deepEqual(policy.getBossAura(enemies), { active: false, affectedEnemyIds: [], modifiers: null });
console.log('black-forest-depths-policy: assertions passed');
