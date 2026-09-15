const assert = require('node:assert/strict');
const policy = require('../chapter-two-progression-policy.js');

assert.deepEqual(policy.MAP_ORDER, ['black-forest-entrance', 'black-forest-trail', 'spider-nest', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths']);

const newCharacter = { unlockedChapter: 1, mapUnlocked: {} };
policy.normalize(newCharacter);
assert.equal(policy.isChapterUnlocked(newCharacter), false);
assert.equal(policy.canEnter(newCharacter, 'black-forest-entrance', true), false);

const progress = { unlockedChapter: 2, mapUnlocked: { 'black-forest': true } };
policy.normalize(progress);
assert.equal(policy.canEnter(progress, 'black-forest-entrance', true), true);
assert.equal(policy.canEnter(progress, 'black-forest-trail', true), false);
assert.equal(policy.canEnter(progress, 'spider-nest', true), false);
assert.equal(policy.canEnter(progress, 'black-forest-entrance', false), false, 'implementation status still gates entry');

assert.equal(policy.recordBossKill(progress, 'black-forest-entrance', { id: 'blackstoneCenturion' }).firstClear, false);
const entranceClear = policy.recordBossKill(progress, 'black-forest-entrance', { id: 'forestGuardianV2' });
assert.deepEqual(entranceClear, { firstClear: true, mapId: 'black-forest-entrance', nextMapId: 'black-forest-trail', chapterCompleted: false });
assert.equal(policy.getMapState(progress, 'black-forest-entrance', true).cleared, true);
assert.equal(policy.canEnter(progress, 'black-forest-trail', true), true);
const firstClear = policy.recordBossKill(progress, 'black-forest-trail', { id: 'blackstoneCenturion' });
assert.deepEqual(firstClear, { firstClear: true, mapId: 'black-forest-trail', nextMapId: 'spider-nest', chapterCompleted: false });
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
assert.equal(legacy.chapterTwoProgress.unlocked['black-forest-entrance'], true);
assert.equal(legacy.chapterTwoProgress.unlocked['black-forest-trail'], true);
assert.equal(legacy.chapterTwoProgress.unlocked['spider-nest'], true);

const oldOrderSave = { unlockedChapter: 2, chapterTwoProgress: policy.createDefaultState() };
oldOrderSave.chapterTwoProgress.unlocked['black-forest-trail'] = true;
oldOrderSave.chapterTwoProgress.cleared['black-forest-trail'] = true;
oldOrderSave.chapterTwoProgress.bossFirstKills['black-forest-trail'] = true;
oldOrderSave.chapterTwoProgress.unlocked['spider-nest'] = true;
oldOrderSave.chapterTwoProgress.cleared['spider-nest'] = true;
oldOrderSave.chapterTwoProgress.bossFirstKills['spider-nest'] = true;
oldOrderSave.chapterTwoProgress.unlocked['black-forest-entrance'] = true;
policy.normalize(oldOrderSave);
assert.equal(oldOrderSave.chapterTwoProgress.cleared['black-forest-trail'], true, 'old cleared maps remain cleared');
assert.equal(oldOrderSave.chapterTwoProgress.bossFirstKills['spider-nest'], true, 'old first-clear flags remain intact');
assert.equal(oldOrderSave.chapterTwoProgress.unlocked['black-forest-entrance'], true, 'the corrected first map remains available');
assert.equal(oldOrderSave.chapterTwoProgress.unlocked['blackstone-stronghold'], false, 'an old-order save cannot skip the corrected entrance requirement');
policy.recordBossKill(oldOrderSave, 'black-forest-entrance', { id: 'forestGuardianV2' });
policy.normalize(oldOrderSave);
assert.equal(oldOrderSave.chapterTwoProgress.unlocked['blackstone-stronghold'], true, 'finishing the missing prerequisite resumes the preserved progress chain');

const partiallyAdvancedOldSave = { unlockedChapter: 2, chapterTwoProgress: policy.createDefaultState() };
partiallyAdvancedOldSave.chapterTwoProgress.unlocked['spider-nest'] = true;
const outOfOrderClear = policy.recordBossKill(partiallyAdvancedOldSave, 'spider-nest', { id: 'giantSpider' });
assert.equal(outOfOrderClear.firstClear, true, 'an earned old-save boss clear is preserved');
assert.equal(outOfOrderClear.nextMapId, null, 'an out-of-order old save cannot unlock a later map before corrected prerequisites');
assert.equal(partiallyAdvancedOldSave.chapterTwoProgress.unlocked['blackstone-stronghold'], false);

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
