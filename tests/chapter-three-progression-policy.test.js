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
assert.equal(progression.canEnter(completedChapterTwo, 'bloodwar-wastes', false), false, '3-3 unlocks but remains unimplemented');

const reloaded = JSON.parse(JSON.stringify(completedChapterTwo));
assert.equal(progression.getMapState(reloaded, 'redrock-wastes-entrance', true).cleared, true, 'serialized clear survives reload');
assert.equal(progression.getMapState(reloaded, 'brokenrock-canyon', false).unlocked, true, 'serialized next-map unlock survives reload');
assert.equal(progression.getMapState(reloaded, 'brokenrock-canyon', true).cleared, true, 'serialized 3-2 clear survives reload');
assert.equal(progression.getMapState(reloaded, 'bloodwar-wastes', false).unlocked, true, 'serialized 3-3 unlock survives reload');
console.log('chapter-three-progression-policy: assertions passed');
