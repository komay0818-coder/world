'use strict';
const assert = require('node:assert/strict');
const progression = require('../chapter-three-progression-policy.js');
const maps = require('../chapter-three-map-policy.js');

const locked = { unlockedChapter: 2, chapterTwoProgress: { completed: false } };
assert.equal(progression.canEnter(locked, 'redrock-wastes-entrance', true), false);

const completedChapterTwo = { unlockedChapter: 2, chapterTwoProgress: { completed: true } };
maps.normalizeChapterUnlock(completedChapterTwo);
assert.equal(progression.canEnter(completedChapterTwo, 'redrock-wastes-entrance', true), true, '2-6 completion unlocks playable 3-1');

assert.equal(progression.getMapState(completedChapterTwo, 'redrock-wastes-entrance', true).cleared, false, 'entering with a living boss is not a clear');
assert.equal(progression.canEnter(completedChapterTwo, 'brokenrock-canyon', true), false, '3-2 remains locked before 3-1 clear');

const wrongBoss = progression.recordBossKill(completedChapterTwo, 'redrock-wastes-entrance', { id: 'redrock-hornbeast', isElite: true });
assert.equal(wrongBoss.firstClear, false);
assert.equal(progression.getMapState(completedChapterTwo, 'redrock-wastes-entrance', true).cleared, false);

const clear = progression.recordBossKill(completedChapterTwo, 'redrock-wastes-entrance', { id: 'redrock-giant-lizard', isBoss: true });
assert.deepEqual(clear, { firstClear: true, mapId: 'redrock-wastes-entrance', nextMapId: 'brokenrock-canyon' });
assert.equal(progression.getMapState(completedChapterTwo, 'redrock-wastes-entrance', true).cleared, true);
assert.equal(progression.getMapState(completedChapterTwo, 'brokenrock-canyon', false).unlocked, true);
assert.equal(progression.canEnter(completedChapterTwo, 'brokenrock-canyon', true), true, '3-1 clear makes implemented 3-2 enterable');
assert.equal(progression.getMapState(completedChapterTwo, 'brokenrock-canyon', true).cleared, false, 'living 3-2 boss is not a clear');
const canyonClear = progression.recordBossKill(completedChapterTwo, 'brokenrock-canyon', { id: 'canyon-warlord', isBoss: true });
assert.deepEqual(canyonClear, { firstClear: true, mapId: 'brokenrock-canyon', nextMapId: 'bloodwar-wastes' });
assert.equal(progression.getMapState(completedChapterTwo, 'brokenrock-canyon', true).cleared, true);
assert.equal(progression.getMapState(completedChapterTwo, 'bloodwar-wastes', false).unlocked, true);
assert.equal(progression.canEnter(completedChapterTwo, 'bloodwar-wastes', true), true, '3-2 clear makes implemented 3-3 enterable');
assert.equal(progression.getMapState(completedChapterTwo, 'bloodwar-wastes', true).cleared, false, 'living 3-3 boss is not a clear');
const bloodwarClear = progression.recordBossKill(completedChapterTwo, 'bloodwar-wastes', { id: 'skullcrusher-vanguard-commander', isBoss: true });
assert.deepEqual(bloodwarClear, { firstClear: true, mapId: 'bloodwar-wastes', nextMapId: 'skullcrusher-war-camp' });
assert.equal(progression.getMapState(completedChapterTwo, 'bloodwar-wastes', true).cleared, true);
assert.equal(progression.getMapState(completedChapterTwo, 'skullcrusher-war-camp', false).unlocked, true);
assert.equal(progression.canEnter(completedChapterTwo, 'skullcrusher-war-camp', false), false, '3-4 unlocks but remains unimplemented');

const reloaded = JSON.parse(JSON.stringify(completedChapterTwo));
assert.equal(progression.getMapState(reloaded, 'redrock-wastes-entrance', true).cleared, true, 'serialized clear survives reload');
assert.equal(progression.getMapState(reloaded, 'brokenrock-canyon', false).unlocked, true, 'serialized next-map unlock survives reload');
assert.equal(progression.getMapState(reloaded, 'brokenrock-canyon', true).cleared, true, 'serialized 3-2 clear survives reload');
assert.equal(progression.getMapState(reloaded, 'bloodwar-wastes', false).unlocked, true, 'serialized 3-3 unlock survives reload');
assert.equal(progression.getMapState(reloaded, 'bloodwar-wastes', true).cleared, true, 'serialized 3-3 clear survives reload');
assert.equal(progression.getMapState(reloaded, 'skullcrusher-war-camp', false).unlocked, true, 'serialized 3-4 unlock survives reload');
assert.equal(progression.recordBossKill({}, 'unknown', {}).firstClear, false);
assert.equal(progression.recordBossKill({ unlockedChapter: 3 }, 'redrock-temple', { id: 'redrock-ancient-god' }).firstClear, false, 'locked areas cannot be cleared out of order');
for (const mapId of ['skullcrusher-war-camp', 'ancient-altar', 'redrock-temple']) {
  assert.equal(progression.recordBossKill(reloaded, mapId, { id: 'wrong-boss' }).firstClear, false);
  const result = progression.recordBossKill(reloaded, mapId, { id: progression.BOSS_IDS[mapId], isBoss: true });
  assert.equal(result.firstClear, true);
  assert.equal(result.nextMapId, progression.NEXT_MAP[mapId] || null);
  assert.equal(progression.recordBossKill(reloaded, mapId, { id: progression.BOSS_IDS[mapId] }).firstClear, false, 'repeat kills do not repeat first-clear rewards');
}
assert.equal(reloaded.chapterThreeProgress.completed, true);
assert.equal(progression.normalize(JSON.parse(JSON.stringify(reloaded))).completed, true, 'chapter completion survives reload');
const legacy = { unlockedChapter: 3, chapterThreeProgress: { cleared: { 'skullcrusher-war-camp': true, 'ancient-altar': true } } };
assert.equal(progression.normalize(legacy).unlocked['redrock-temple'], true, 'existing clears restore subsequent unlocks');
assert.equal(legacy.chapterThreeProgress.completed, false);
console.log('chapter-three-progression-policy: assertions passed');
