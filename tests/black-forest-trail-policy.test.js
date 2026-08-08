const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../black-forest-trail-policy.js');

assert.equal(policy.MAP.id, 'black-forest-trail');
assert.equal(policy.MAP.chapter, 2);
assert.equal(policy.MAP.order, 2);
assert.equal(policy.MAP.level, 17);
assert.equal(policy.MAP.enemyPoolId, 'black-forest-trail-enemies');
assert.equal(policy.MAP.bossId, 'blackstone-centurion');
assert.equal(policy.MAP.background, 'assets/black-forest-trail-background.png');
assert.equal(policy.MAP.implemented, false);
assert.equal(policy.MAP.contentStatus, 'monster-foundation');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '黑石斥候', '黑石掠奪者', '黑石弓箭手', '黑石毒蜘蛛', '黑石訓獸師', '黑石隊長', '黑石百夫長'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'normal', 'elite', 'elite', 'boss']);
assert.equal(policy.getMonstersByRank('normal').length, 4);
assert.equal(policy.getMonstersByRank('elite').length, 2);
assert.equal(policy.getMonstersByRank('boss').length, 1);
assert.equal(policy.getMonster('blackstone-poison-spider').ownerFaction, 'blackstone-bandits');
assert.deepEqual(policy.getMonster('blackstone-poison-spider').tags, ['beast', 'poison', 'spider']);
assert.equal(policy.STORY.previousMapId, 'black-forest-entrance');
assert.equal(policy.STORY.nextMapId, 'spider-nest');
assert.equal(policy.STORY.completionObjectiveId, 'defeat-blackstone-centurion');
assert.equal(policy.STORY.completionClueId, 'spider-nest-route-clue');
assert.ok(policy.STORY.discoveries.includes('patrol-and-supply-route'));
assert.ok(policy.STORY.discoveries.includes('poison-spider-husbandry'));
assert.ok(policy.MONSTERS.every((monster) => monster.level === 17 && monster.image === null && monster.stats === null
  && monster.dropTableId === null && monster.aiProfileId === null && monster.skillIds.length === 0 && monster.implemented === false));
assert.equal(policy.getMonster('unknown'), null);
const background = fs.readFileSync(path.join(__dirname, '..', policy.MAP.background));
assert.equal(background.subarray(1, 4).toString(), 'PNG', 'the Black Forest trail background is a PNG asset');
assert.equal(background[25], 2, 'the Black Forest trail background uses RGB color');

console.log('black-forest-trail-policy: assertions passed');
