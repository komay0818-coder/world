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

const finale = { unlockedChapter: 2, mapUnlocked: { 'black-forest': true } };
policy.normalize(finale);
policy.MAP_ORDER.slice(0, -1).forEach((mapId) => {
  policy.recordBossKill(finale, mapId, { id: policy.BOSS_IDS[mapId] });
});
const chapterClear = policy.recordBossKill(finale, 'black-forest-depths', { id: 'heartOfTheBlackForest' });
assert.deepEqual(chapterClear, { firstClear: true, mapId: 'black-forest-depths', nextMapId: null, chapterCompleted: true });
assert.equal(finale.chapterTwoProgress.completed, true);
assert.equal(finale.chapterTwoProgress.cleared['black-forest-depths'], true);
assert.equal(finale.chapterTwoProgress.bossFirstKills['black-forest-depths'], true);
assert.equal(policy.recordBossKill(finale, 'black-forest-depths', { id: 'heartOfTheBlackForest' }).firstClear, false);
const finaleReloaded = JSON.parse(JSON.stringify(finale));
policy.normalize(finaleReloaded);
assert.equal(finaleReloaded.chapterTwoProgress.completed, true);
console.log('chapter-two-progression-policy: assertions passed');
