const assert = require('node:assert/strict');
const policy = require('../chapter-three-map-policy.js');

assert.equal(policy.CHAPTER.chapter, 3);
assert.equal(policy.CHAPTER.name, '赤岩荒原');
assert.equal(policy.CHAPTER.recommendedLevelRange, null);
assert.equal(policy.CHAPTER.firstJobChangeLevel, 45);
assert.deepEqual(policy.MAPS.map((map) => map.name), ['赤岩荒原', '斷岩峽谷', '血戰荒原', '碎顱戰爭營地', '遠古祭壇', '赤岩聖殿']);
assert.deepEqual(policy.MAPS.map((map) => map.facilityRequirement), [10, 15, 20, 25, 30, 35]);
assert.ok(policy.MAPS.every((map) => map.min === null && map.max === null && map.suppressionValues === null));
assert.ok(policy.MAPS.every((map) => map.implemented === false && policy.canEnter(map.id) === false));
assert.equal(policy.getMap('skullcrusher-war-camp').dungeon, true);
assert.equal(policy.getMap('ancient-altar').facilityPresentationStatus, 'name-and-appearance-pending');
assert.equal(policy.getMap('redrock-temple').bossId, null);
assert.equal(policy.getMap('redrock-temple').finalBossStatus, 'reserved');
assert.equal(policy.getMap('redrock-temple').awakeningCoreSource, null);
assert.equal(policy.getEnemy('redrock-giant-lizard').name, '赤岩巨蜥');

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
