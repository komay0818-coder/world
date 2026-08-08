const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../black-forest-entrance-policy.js');

assert.equal(policy.MAP.id, 'black-forest-entrance');
assert.equal(policy.MAP.chapter, 2);
assert.equal(policy.MAP.order, 1);
assert.equal(policy.MAP.enemyPoolId, 'black-forest-entrance-enemies');
assert.equal(policy.MAP.bossId, 'forest-guardian');
assert.equal(policy.MAP.background, 'assets/black-forest-entrance-background.png');
assert.equal(policy.MAP.implemented, false);
assert.equal(policy.MAP.contentStatus, 'combat-ready');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '黑森林野狼', '腐化野豬', '暗影蜘蛛', '枯木行者', '黑森林獵人', '森林守護者'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'normal', 'elite', 'boss']);
assert.equal(policy.getMonstersByRank('normal').length, 4);
assert.equal(policy.getMonstersByRank('elite').length, 1);
assert.equal(policy.getMonstersByRank('boss').length, 1);
assert.equal(policy.getMonster('black-forest-hunter').visualStyle, 'night-elf');
assert.deepEqual(policy.getMonster('shadow-spider').tags, ['poison']);
assert.equal(policy.getMonster('black-forest-wolf').image, 'assets/black-forest-wolf.png');
assert.equal(policy.getMonster('corrupted-boar').image, 'assets/corrupted-boar.png');
assert.equal(policy.getMonster('shadow-spider').image, 'assets/shadow-spider.png');
assert.equal(policy.getMonster('withered-tree-walker').image, 'assets/withered-tree-walker.png');
assert.equal(policy.getMonster('black-forest-hunter').image, 'assets/black-forest-hunter.png');
assert.equal(policy.getMonster('forest-guardian').image, 'assets/forest-guardian.png');
assert.ok(policy.MONSTERS.every((monster) => monster.image !== null));
assert.ok(policy.MONSTERS.every((monster) => monster.stats !== null && monster.dropTableId === 'black-forest-entrance-pending'
  && monster.aiProfileId !== null && monster.skillIds.length > 0 && monster.implemented === true));
assert.equal(policy.getMonster('unknown'), null);

assert.deepEqual(policy.getCombatPool(), {
  normal: ['blackForestWolf', 'corruptedBoar', 'shadowSpider', 'witheredTreeWalker'],
  elite: ['blackForestHunter'],
  boss: ['forestGuardianV2']
});
assert.equal(policy.rollLevel('blackForestWolf', 0), 15);
assert.equal(policy.rollLevel('blackForestWolf', .999), 16);
assert.equal(policy.getCombatMonster('blackForestWolf', 15).maxHp, 145);
assert.equal(policy.getCombatMonster('blackForestWolf', 16).maxHp, 165);
assert.equal(policy.getCombatMonster('blackForestHunter').isElite, true);
assert.equal(policy.getCombatMonster('forestGuardianV2').isBoss, true);
assert.equal(policy.resolveAction('blackForestWolf', .24), 'shadow-bite');
assert.equal(policy.resolveAction('blackForestWolf', .25), 'attack');
assert.equal(policy.resolveAction('corruptedBoar', .19), 'charge');
assert.equal(policy.resolveAction('shadowSpider', .29), 'venom-fang');
assert.equal(policy.resolveAction('witheredTreeWalker', .19), 'entangling-roots');
assert.equal(policy.resolveAction('blackForestHunter', .99, .29), 'execution-arrow');
assert.equal(policy.resolveAction('blackForestHunter', .24, .8), 'binding-arrow');
assert.equal(policy.getPhase('forestGuardianV2', 1400, 2100), 2);
assert.equal(policy.getPhase('forestGuardianV2', 700, 2100), 3);
assert.equal(policy.resolveAction('forestGuardianV2', .19, 1, 1400, 2100), 'leaf-storm');
assert.equal(policy.getDamageMultiplier('execution-arrow'), 1.6);
assert.deepEqual(policy.getCombatMultipliers('corruptedBoar', 80, 220), { attack: 1.2, attackSpeed: 1.15, defense: 1 });
assert.deepEqual(policy.getCombatMultipliers('forestGuardianV2', 700, 2100), { attack: 1.2, attackSpeed: 1.15, defense: .9 });

['black-forest-wolf.png', 'corrupted-boar.png', 'shadow-spider.png', 'withered-tree-walker.png', 'black-forest-hunter.png', 'forest-guardian.png'].forEach((filename) => {
  const png = fs.readFileSync(path.join(__dirname, '..', 'assets', filename));
  assert.equal(png.subarray(1, 4).toString(), 'PNG', `${filename} is a PNG asset`);
  assert.equal(png[25], 6, `${filename} uses RGBA color type with an alpha channel`);
});

console.log('black-forest-entrance-policy: assertions passed');
