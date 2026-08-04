const assert = require('node:assert/strict');
const policy = require('../chapter-boss-drop-policy.js');

function sequence(values) { let index = 0; return () => values[Math.min(index++, values.length - 1)]; }

assert.equal(policy.BLUE_ITEM_DROP_RATE, .03);
assert.deepEqual(policy.CHAPTER_BLUE_ITEM_DROP_RATES, { 1: .03, 2: .05, 3: .08 });
assert.equal(policy.isEligibleFinalBoss({ id: 'greatfangWolf', isBoss: true }, { chapter: 1, finalBossId: 'greatfangWolf' }), true);
assert.equal(policy.isEligibleFinalBoss({ id: 'ragingWolf', isElite: true }, { chapter: 1, finalBossId: 'greatfangWolf' }), false);
assert.equal(policy.isEligibleFinalBoss({ id: 'goblinCaptain', isBoss: true }, { chapter: 1, finalBossId: 'goblinHighChief' }), false, 'intermediate dungeon bosses are excluded');
assert.equal(policy.isEligibleFinalBoss({ id: 'futureBoss', isBoss: true }, { chapter: 1, finalBossId: 'futureBoss' }), true, 'future chapter-one final bosses use the same rule');
assert.equal(policy.isEligibleFinalBoss({ id: 'futureBoss', isBoss: true }, { chapter: 2, finalBossId: 'futureBoss' }), false);

const missed = { inventory: [] };
assert.equal(policy.grantChapterBossBlueDrop(missed, { id: 'boarKing', isBoss: true }, { chapter: 1, finalBossId: 'boarKing' }, { random: sequence([.03]) }), null);
assert.deepEqual(missed.inventory, []);

const normal = { inventory: [] };
assert.equal(policy.grantChapterBossBlueDrop(normal, { id: 'forestBoar' }, { chapter: 1, finalBossId: 'boarKing' }, { random: sequence([0]) }), null);
assert.deepEqual(normal.inventory, []);

const progress = { inventory: [] };
const blue = policy.grantChapterBossBlueDrop(progress, { id: 'greatfangWolf', isBoss: true }, { chapter: 1, finalBossId: 'greatfangWolf' }, {
  random: sequence([.029, 0, 0, .999]), instanceIdFactory: () => 'blue-boss-1', obtainedAt: 123
});
assert.ok(blue);
assert.equal(progress.inventory[0], blue);
assert.equal(blue.quality, 'rare');
assert.equal(blue.rarity, 'rare');
assert.equal(blue.fixedAffixes.length, 2);
assert.equal(blue.randomAffixes.length, 3);
assert.equal(blue.affixes.length, 5);
assert.equal(new Set(blue.affixes.map((entry) => entry.stat)).size, 5, 'blue affixes never duplicate');
assert.equal(blue.instanceId, 'blue-boss-1');
assert.equal(blue.obtainedFrom, 'greatfangWolf');
assert.equal(blue.obtainedAt, 123);
assert.equal(blue.specialDropType, 'chapter-boss-blue');

const otherClassProgress = { inventory: [] };
const otherClassItem = policy.grantChapterBossBlueDrop(otherClassProgress, { id: 'boarKing', isBoss: true }, { chapter: 1, finalBossId: 'boarKing' }, {
  random: sequence([0, .999, 0, .999]), instanceIdFactory: () => 'blue-boss-2'
});
assert.ok(otherClassItem.allowedJobs.length > 0, 'template restrictions remain on the item instead of filtering against the current character');
assert.notDeepEqual(blue.allowedJobs, otherClassItem.allowedJobs, 'the random pool can produce gear for different professions');

const snapshot = JSON.stringify(blue);
assert.deepEqual(JSON.parse(snapshot), blue, 'save/load preserves both final affixes and values');

console.log('chapter-boss-drop-policy: assertions passed');
