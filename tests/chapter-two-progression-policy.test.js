const assert = require('node:assert/strict');
const policy = require('../chapter-two-progression-policy.js');

assert.deepEqual(policy.MAP_ORDER, ['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths']);

const newCharacter = { unlockedChapter: 1, mapUnlocked: {} };
policy.normalize(newCharacter);
assert.equal(policy.isChapterUnlocked(newCharacter), false);
assert.equal(policy.canEnter(newCharacter, 'black-forest-trail', true), false);

const progress = { unlockedChapter: 2, mapUnlocked: { 'black-forest': true } };
policy.normalize(progress);
assert.equal(policy.canEnter(progress, 'black-forest-trail', true), true);
assert.equal(policy.canEnter(progress, 'spider-nest', true), false);
assert.equal(policy.canEnter(progress, 'black-forest-entrance', false), false);

assert.equal(policy.recordBossKill(progress, 'black-forest-trail', { id: 'giantSpider' }).firstClear, false);
const firstClear = policy.recordBossKill(progress, 'black-forest-trail', { id: 'blackstoneCenturion' });
assert.deepEqual(firstClear, { firstClear: true, mapId: 'black-forest-trail', nextMapId: 'spider-nest', chapterCompleted: false });
assert.equal(policy.getMapState(progress, 'black-forest-trail', true).cleared, true);
assert.equal(policy.canEnter(progress, 'spider-nest', true), true);
assert.equal(policy.recordBossKill(progress, 'black-forest-trail', { id: 'blackstoneCenturion' }).firstClear, false);

policy.recordNormalKill(progress, 'spider-nest', 3);
const reloaded = JSON.parse(JSON.stringify(progress));
policy.normalize(reloaded);
assert.equal(reloaded.chapterTwoProgress.cleared['black-forest-trail'], true);
assert.equal(reloaded.chapterTwoProgress.unlocked['spider-nest'], true);
assert.equal(reloaded.chapterTwoProgress.normalKills['spider-nest'], 3);

const legacy = { unlockedChapter: 2, selectedMapId: 'spider-nest' };
policy.normalize(legacy);
assert.equal(legacy.chapterTwoProgress.unlocked['black-forest-trail'], true);
assert.equal(legacy.chapterTwoProgress.unlocked['spider-nest'], true);

const reset = { unlockedChapter: 1 };
assert.deepEqual(policy.normalize(reset), policy.createDefaultState());
console.log('chapter-two-progression-policy: assertions passed');
