const assert = require('node:assert/strict');
const policy = require('../chapter-boss-drop-policy.js');
const equipmentPolicy = require('../equipment-drop-policy.js');

function sequence(values) { let index = 0; return () => values[Math.min(index++, values.length - 1)]; }

assert.equal(policy.BLUE_ITEM_DROP_RATE, .10);
assert.deepEqual(policy.CHAPTER_BLUE_ITEM_DROP_RATES, { 1: .10, 2: .05, 3: .08 }, 'later chapter rates remain unchanged');
assert.deepEqual(policy.CHAPTER_ONE_BLUE_DROP_RATES, {
  normal: 0,
  elite: .03,
  goblinTreasureChest: .05,
  goblinHighChief: .07,
  wanderingBlackKnight: .07,
  blackstoneLeader: .10
});
assert.deepEqual(policy.CHAPTER_ONE_EQUIPMENT_POOLS, ['plains_common_weapons', 'plains_common_armor']);

assert.equal(policy.getChapterOneBlueDropRate({ id: 'forestBoar' }, { chapter: 1 }), 0);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'ragingWolf', isElite: true }, { chapter: 1 }), .03);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'goblinTreasureChest' }, { chapter: 1 }), .05);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'goblinHighChief', isBoss: true }, { chapter: 1 }), .07);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'wanderingBlackKnight', isElite: true }, { chapter: 1 }), .07);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'blackstoneLeader', isBoss: true }, { chapter: 1 }), .10);
assert.equal(policy.getChapterOneBlueDropRate({ id: 'ragingWolf', isElite: true }, { chapter: 2 }), 0);
assert.equal(policy.isEligibleFinalBoss({ id: 'blackstoneLeader', isBoss: true }, { chapter: 1, finalBossId: 'blackstoneLeader' }), true);
assert.equal(policy.isEligibleFinalBoss({ id: 'greatfangWolf', isBoss: true }, { chapter: 1, finalBossId: 'greatfangWolf' }), false);

const missed = { inventory: [] };
assert.equal(policy.grantChapterOneBlueDrop(missed, { id: 'ragingWolf', isElite: true }, { chapter: 1 }, { random: sequence([.03]) }), null);
assert.deepEqual(missed.inventory, []);

const normal = { inventory: [] };
assert.equal(policy.grantChapterOneBlueDrop(normal, { id: 'forestBoar' }, { chapter: 1 }, { random: sequence([0]) }), null);
assert.deepEqual(normal.inventory, []);

const progress = { inventory: [] };
const eliteBlue = policy.grantChapterOneBlueDrop(progress, { id: 'ragingWolf', isElite: true }, { chapter: 1 }, {
  random: sequence([.029, 0, 0, .999]), instanceIdFactory: () => 'blue-elite-1', obtainedAt: 123
});
assert.ok(eliteBlue);
assert.equal(progress.inventory[0], eliteBlue);
assert.equal(eliteBlue.quality, 'rare');
assert.equal(eliteBlue.rarity, 'rare');
assert.equal(eliteBlue.fixedAffixes.length, 2);
assert.equal(eliteBlue.randomAffixes.length, 3);
assert.equal(eliteBlue.affixes.length, 5);
assert.equal(new Set(eliteBlue.affixes.map((entry) => entry.stat)).size, 5, 'blue affixes never duplicate');
assert.equal(eliteBlue.instanceId, 'blue-elite-1');
assert.equal(eliteBlue.obtainedFrom, 'ragingWolf');
assert.equal(eliteBlue.obtainedAt, 123);
assert.equal(eliteBlue.specialDropType, 'chapter-one-blue');
const chapterOneTemplateIds = policy.CHAPTER_ONE_EQUIPMENT_POOLS.flatMap((poolId) => equipmentPolicy.EQUIPMENT_POOLS[poolId]);
assert.ok(chapterOneTemplateIds.includes(eliteBlue.templateId), 'chapter-one blue drops cannot select chapter-two templates');

const bossProgress = { inventory: [] };
const bossBlue = policy.grantChapterOneBlueDrop(bossProgress, { id: 'blackstoneLeader', isBoss: true }, { chapter: 1, finalBossId: 'blackstoneLeader' }, {
  random: sequence([.099, .999, 0, .999]), instanceIdFactory: () => 'blue-boss-1', obtainedAt: 456
});
assert.ok(bossBlue);
assert.equal(bossBlue.specialDropType, 'chapter-boss-blue');
assert.equal(bossBlue.obtainedFrom, 'blackstoneLeader');
assert.equal(bossBlue.obtainedAt, 456);
assert.deepEqual(JSON.parse(JSON.stringify(bossBlue)), bossBlue, 'save/load preserves the generated blue equipment');

console.log('chapter-boss-drop-policy: assertions passed');
