const assert = require('node:assert/strict');
const policy = require('../spider-nest-policy.js');

assert.equal(policy.MAP.id, 'spider-nest');
assert.equal(policy.MAP.level, 19);
assert.equal(policy.MAP.enemyPoolId, 'spider-nest-enemies');
assert.equal(policy.MAP.bossId, 'giant-spider');
assert.equal(policy.MAP.background, 'assets/spider-nest-background.png');
assert.equal(policy.MAP.implemented, false);
assert.equal(policy.MAP.contentStatus, 'monster-foundation');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '黑石毒蜘蛛', '噴毒蜘蛛', '蛛網編織者', '黑石毒獵手', '黑石訓獸師', '黑石毒刃刺客', '巨大蜘蛛'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'normal', 'elite', 'elite', 'boss']);
assert.equal(policy.getMonstersByRank('normal').length, 4);
assert.equal(policy.getMonstersByRank('elite').length, 2);
assert.equal(policy.getMonstersByRank('boss').length, 1);
assert.equal(policy.getMonster('blackstone-venom-hunter').race, 'goblin');
assert.equal(policy.getMonster('blackstone-venomblade-assassin').race, 'orc');
assert.equal(policy.getMonster('giant-spider').bodyProfile, 'giant-bloated-abdomen');
assert.equal(policy.getMonster('venom-spitter-spider').image, 'assets/venom-spitter-spider.png');
assert.equal(policy.getMonster('web-weaver').image, 'assets/web-weaver.png');
assert.equal(policy.getMonster('blackstone-venom-hunter').image, 'assets/blackstone-venom-hunter.png');
assert.equal(policy.getMonster('blackstone-venomblade-assassin').image, 'assets/blackstone-venomblade-assassin.png');
assert.equal(policy.getMonster('giant-spider').image, 'assets/giant-spider.png');
assert.equal(policy.getMonster('spider-nest-blackstone-poison-spider').image, 'assets/blackstone-poison-spider.png');
assert.equal(policy.getMonster('spider-nest-blackstone-beastmaster').image, 'assets/blackstone-beastmaster.png');
assert.ok(policy.MONSTERS.every((monster) => monster.level === 19 && monster.stats === null
  && monster.dropTableId === null && monster.aiProfileId === null && monster.skillIds.length === 0 && monster.implemented === false));
assert.ok(policy.MONSTERS.every((monster) => typeof monster.image === 'string' && monster.image.startsWith('assets/')));
assert.equal(policy.STORY.previousMapId, 'black-forest-trail');
assert.equal(policy.STORY.nextMapId, 'blackstone-stronghold');
assert.equal(policy.STORY.completionObjectiveId, 'defeat-giant-spider');
assert.equal(policy.getMonster('unknown'), null);
const fs = require('node:fs');
const path = require('node:path');
const background = fs.readFileSync(path.join(__dirname, '..', policy.MAP.background));
assert.equal(background.subarray(1, 4).toString(), 'PNG', 'the Spider Nest background is a PNG asset');
assert.equal(background[25], 2, 'the Spider Nest background uses RGB color');
const venomSpitter = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('venom-spitter-spider').image));
assert.equal(venomSpitter.subarray(1, 4).toString(), 'PNG', 'the venom spitter spider is a PNG asset');
assert.equal(venomSpitter[25], 6, 'the venom spitter spider uses RGBA color with transparency');
const webWeaver = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('web-weaver').image));
assert.equal(webWeaver.subarray(1, 4).toString(), 'PNG', 'the web weaver is a PNG asset');
assert.equal(webWeaver[25], 6, 'the web weaver uses RGBA color with transparency');
const venomHunter = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-venom-hunter').image));
assert.equal(venomHunter.subarray(1, 4).toString(), 'PNG', 'the Blackstone venom hunter is a PNG asset');
assert.equal(venomHunter[25], 6, 'the Blackstone venom hunter uses RGBA color with transparency');
const venombladeAssassin = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-venomblade-assassin').image));
assert.equal(venombladeAssassin.subarray(1, 4).toString(), 'PNG', 'the Blackstone venomblade assassin is a PNG asset');
assert.equal(venombladeAssassin[25], 6, 'the Blackstone venomblade assassin uses RGBA color with transparency');
const giantSpider = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('giant-spider').image));
assert.equal(giantSpider.subarray(1, 4).toString(), 'PNG', 'the giant spider is a PNG asset');
assert.equal(giantSpider[25], 6, 'the giant spider uses RGBA color with transparency');

console.log('spider-nest-policy: assertions passed');
