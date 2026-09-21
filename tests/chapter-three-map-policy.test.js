const assert = require('node:assert/strict');
const policy = require('../chapter-three-map-policy.js');

assert.equal(policy.CHAPTER.chapter, 3);
assert.equal(policy.CHAPTER.name, '赤岩荒原');
assert.equal(policy.CHAPTER.recommendedLevelRange, null);
assert.equal(policy.CHAPTER.firstJobChangeLevel, 45);
assert.deepEqual(policy.MAPS.map((map) => map.name), ['赤岩荒原', '斷岩峽谷', '血戰荒原', '碎顱戰爭營地', '遠古祭壇', '赤岩聖殿']);
assert.deepEqual(policy.MAPS.map((map) => map.facilityRequirement), [10, 15, 20, 25, 30, 35]);
assert.equal(policy.MAPS[0].min, 30);
assert.equal(policy.MAPS[0].max, 30);
assert.deepEqual([policy.MAPS[1].min, policy.MAPS[1].max], [30, 30]);
assert.ok(policy.MAPS.slice(2).every((map) => map.min === null && map.max === null));
assert.ok(policy.MAPS.every((map) => map.suppressionValues === null));
assert.equal(policy.MAPS[0].implemented, true);
assert.equal(policy.MAPS[1].implemented, true);
assert.ok(policy.MAPS.slice(2).every((map) => map.implemented === false));
const lockedChapter = { unlockedChapter: 2 };
const unlockedChapter = { unlockedChapter: 3 };
assert.equal(policy.isChapterUnlocked(lockedChapter), false);
assert.equal(policy.isChapterUnlocked(unlockedChapter), true);
assert.deepEqual(policy.getMapState(unlockedChapter, 'redrock-wastes-entrance'), {
  mapId: 'redrock-wastes-entrance', chapterUnlocked: true, unlocked: true, implemented: true
});
assert.equal(policy.getMapState(unlockedChapter, 'brokenrock-canyon').unlocked, false, 'only the first map is eligible before chapter-three progression exists');
assert.equal(policy.canEnter(unlockedChapter, 'redrock-wastes-entrance'), true, 'the implemented first map can be entered once chapter three is unlocked');
assert.equal(policy.canEnter(lockedChapter, 'redrock-wastes-entrance'), false);
const completedLegacySave = { unlockedChapter: 2, chapterTwoProgress: { completed: true } };
assert.equal(policy.normalizeChapterUnlock(completedLegacySave), 3);
assert.equal(completedLegacySave.unlockedChapter, 3, 'a completed chapter-two save migrates without another boss kill');
const newCharacter = { unlockedChapter: 1, chapterTwoProgress: { completed: false } };
assert.equal(policy.normalizeChapterUnlock(newCharacter), 1, 'new characters keep only chapter one unlocked');
assert.equal(policy.getMap('skullcrusher-war-camp').dungeon, true);
assert.equal(policy.getMap('ancient-altar').facilityPresentationStatus, 'name-and-appearance-pending');
assert.equal(policy.getMap('redrock-temple').bossId, 'redrock-ancient-god');
assert.equal(policy.getMap('redrock-temple').finalBossStatus, 'provisional-mechanics-implemented');
assert.equal(policy.getMap('redrock-temple').awakeningCoreSource, null);
assert.equal(policy.getEnemy('redrock-giant-lizard').name, '赤岩巨蜥');
[
  'wasteland-hyena', 'redrock-lizard', 'wasteland-vulture',
  'skullcrusher-scout', 'redrock-hornbeast', 'redrock-giant-lizard'
].forEach((enemyId) => {
  assert.equal(policy.getEnemy(enemyId).image, `assets/${enemyId}.png`, `${enemyId} has dedicated 3-1 artwork`);
});
[
  'skullcrusher-spearman', 'skullcrusher-warrior', 'brokenrock-brute', 'canyon-warlord'
].forEach((enemyId) => {
  assert.equal(policy.getEnemy(enemyId).image, `assets/${enemyId}.png`, `${enemyId} has dedicated 3-2 artwork`);
});
assert.equal(policy.getEnemy('redrock-ancient-god').name, '赤岩古神（暫定）');

const empty = policy.normalizeFacilityProgress();
assert.deepEqual(empty['redrock-wastes-entrance'], { 'supply-station': 0, armory: 0, 'shaman-altar': 0 });
let progress = policy.recordFacilityDestroyed(empty, 'bloodwar-wastes', 'armory', 27);
assert.deepEqual(policy.getFacilityStatus(progress, 'bloodwar-wastes', 'armory'), { count: 27, required: 20, complete: true });
assert.equal(policy.getFacilityStatus(progress, 'brokenrock-canyon', 'armory').count, 0, 'each map starts independently');
progress = policy.recordFacilityDestroyed(progress, 'brokenrock-canyon', 'armory', 4);
assert.equal(policy.getFacilityStatus(progress, 'bloodwar-wastes', 'armory').count, 27, 'returning to a map preserves its progress');
assert.equal(policy.getFacilityStatus(progress, 'brokenrock-canyon', 'armory').count, 4);
assert.equal(policy.FACILITY_TYPES.supplyStation.value, null, 'suppression strength remains undecided');

console.log('chapter-three-map-policy: assertions passed');
