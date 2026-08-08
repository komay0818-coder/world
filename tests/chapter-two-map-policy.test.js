const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../chapter-two-map-policy.js');

assert.equal(policy.CHAPTER.chapter, 2);
assert.equal(policy.CHAPTER.minLevel, 15);
assert.equal(policy.CHAPTER.maxLevel, 30);
assert.equal(policy.CHAPTER.previousMapId, 'plains-depths');
assert.equal(policy.CHAPTER.firstMapId, 'black-forest-entrance');
assert.equal(policy.CHAPTER.finalMapId, 'black-forest-depths');
assert.equal(policy.getMap('black-forest-entrance').enemyPoolId, 'black-forest-entrance-enemies');
assert.equal(policy.getMap('black-forest-entrance').bossId, 'forest-guardian');
assert.equal(policy.getMap('black-forest-entrance').contentStatus, 'combat-ready');
assert.equal(policy.getMap('black-forest-entrance').background, 'assets/black-forest-entrance-background.png');
const entranceBackground = fs.readFileSync(path.join(__dirname, '..', policy.getMap('black-forest-entrance').background));
assert.equal(entranceBackground.subarray(1, 4).toString(), 'PNG', 'the entrance background is a PNG asset');
assert.equal(policy.getMap('black-forest-trail').min, 17);
assert.equal(policy.getMap('black-forest-trail').max, 17);
assert.equal(policy.getMap('black-forest-trail').enemyPoolId, 'black-forest-trail-enemies');
assert.equal(policy.getMap('black-forest-trail').bossId, 'blackstone-centurion');
assert.equal(policy.getMap('black-forest-trail').contentStatus, 'monster-foundation');
assert.equal(policy.getMap('black-forest-trail').background, 'assets/black-forest-trail-background.png');
assert.equal(policy.getMap('black-forest-trail').story.completionClueId, 'spider-nest-route-clue');

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
assert.equal(policy.CHAPTER.corruptionPolicyId, 'black-forest-corruption');
assert.equal(new Set(policy.MAPS.map((map) => map.materialTableId)).size, 6);
assert.ok(policy.MAPS.every((map) => map.implemented === false), 'chapter-two combat content remains disabled');
assert.ok(policy.MAPS.every((map) => 'enemyPoolId' in map && 'bossId' in map && 'dropTableId' in map
  && 'materialTableId' in map && 'eventTableId' in map && Array.isArray(map.environmentEffects)),
'all maps reserve future content fields');

const stronghold = policy.getMap('blackstone-stronghold');
assert.equal(stronghold.dungeon, true);
assert.equal(stronghold.gameplayType, 'outpost-siege');
assert.equal(stronghold.objectiveCount, 5);
assert.deepEqual(stronghold.enemyFactionIds, ['blackstone-bandits', 'goblins']);
assert.equal(policy.getDungeon('blackstone-stronghold').primaryFaction, 'blackstone-bandits');
assert.equal(policy.getDungeon('blackstone-stronghold').alliedFaction, 'goblins');
assert.equal(policy.getDungeon('blackstone-stronghold').waveTableId, null);
assert.equal(policy.getDungeon('blackstone-stronghold').gameplayType, 'outpost-siege');
assert.equal(policy.getDungeon('blackstone-stronghold').encounterPolicyId, 'blackstone-stronghold');
assert.equal(policy.getDungeon('blackstone-stronghold').finalBossId, null);
assert.equal(policy.canEnter('blackstone-stronghold'), false, 'placeholder dungeon cannot be entered');
assert.equal(policy.getMap('black-forest-depths').isFinalMap, true);
assert.deepEqual(policy.getMap('black-forest-depths').environmentEffects, ['dense-fog']);
assert.equal(policy.getMap('black-forest-depths').bossAuraPolicyId, 'black-forest-depths-boss-aura');

console.log('chapter-two-map-policy: assertions passed');
