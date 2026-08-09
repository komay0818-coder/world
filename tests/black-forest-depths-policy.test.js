const assert = require('node:assert/strict');
const policy = require('../black-forest-depths-policy.js');

assert.equal(policy.RULES.name, '黑森林深處');
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
assert.ok(policy.MONSTERS.every((monster) => monster.combatId === null && monster.image === null && monster.stats === null
  && monster.dropTableId === null && monster.skillIds.length === 0 && monster.aiProfileId === null && monster.implemented === false));
assert.equal(policy.getMonster('unknown'), null);
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
