const assert = require('node:assert/strict');
const policy = require('../chapter-two-map-policy.js');

assert.equal(policy.CHAPTER.chapter, 2);
assert.equal(policy.CHAPTER.minLevel, 15);
assert.equal(policy.CHAPTER.maxLevel, 30);
assert.equal(policy.CHAPTER.previousMapId, 'plains-depths');
assert.equal(policy.CHAPTER.firstMapId, 'black-forest-entrance');
assert.equal(policy.CHAPTER.finalMapId, 'black-forest-depths');

assert.deepEqual(policy.MAPS.map((map) => map.name), [
  '黑森林入口',
  '黑森林小徑',
  '蜘蛛巢穴',
  '黑石據點',
  '森林祭壇',
  '黑森林深處'
]);
assert.deepEqual(policy.MAPS.map((map) => map.order), [1, 2, 3, 4, 5, 6]);
assert.ok(policy.MAPS.every((map) => map.chapter === 2 && map.regionOf === 'black-forest'));
assert.ok(policy.MAPS.every((map) => map.implemented === false), 'chapter-two combat content remains disabled');
assert.ok(policy.MAPS.every((map) => 'enemyPoolId' in map && 'bossId' in map && 'dropTableId' in map
  && 'materialTableId' in map && 'eventTableId' in map && Array.isArray(map.environmentEffects)),
'all maps reserve future content fields');

const stronghold = policy.getMap('blackstone-stronghold');
assert.equal(stronghold.dungeon, true);
assert.deepEqual(stronghold.enemyFactionIds, ['blackstone-bandits', 'goblins']);
assert.equal(policy.getDungeon('blackstone-stronghold').primaryFaction, 'blackstone-bandits');
assert.equal(policy.getDungeon('blackstone-stronghold').alliedFaction, 'goblins');
assert.equal(policy.getDungeon('blackstone-stronghold').waveTableId, null);
assert.equal(policy.getDungeon('blackstone-stronghold').finalBossId, null);
assert.equal(policy.canEnter('blackstone-stronghold'), false, 'placeholder dungeon cannot be entered');
assert.equal(policy.getMap('black-forest-depths').isFinalMap, true);

console.log('chapter-two-map-policy: assertions passed');
