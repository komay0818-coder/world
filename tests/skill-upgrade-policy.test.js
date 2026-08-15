const assert = require('node:assert/strict');
const policy = require('../skill-upgrade-policy.js');

assert.deepEqual(Object.values(policy.SKILL_BOOK_RANKS).map(({ rank }) => rank), ['初階', '中階', '高階', '專精', '大師', '宗師', '傳承']);
assert.deepEqual(Object.values(policy.SKILL_BOOK_RANKS).map(({ implemented }) => implemented), [true, true, true, false, false, false, false]);
Object.values(policy.SKILL_BOOK_RANKS).forEach((book) => {
  assert.equal(book.imageStatus, 'ready');
  assert.match(book.image, /^assets\/skill-book-[a-z-]+\.png\?v=20260815-user-image-v1$/);
});
['beginner_skill_book', 'intermediate_skill_book', 'advanced_skill_book'].forEach((id) => assert.equal(policy.MATERIALS[id].imageStatus, 'ready'));
const normalizedBook = policy.normalizeMaterialInventory([{ id: 'beginner_skill_book', kind: 'material', quantity: 2 }])[0];
assert.equal(normalizedBook.image, 'assets/skill-book-beginner.png?v=20260815-user-image-v1');
assert.equal(normalizedBook.quantity, 2);

const chapterOne = policy.getUpgradeRequirement(1);
assert.equal(chapterOne.chapter, 1);
assert.equal(chapterOne.targetLevel, 2);
assert.deepEqual(chapterOne.materials.map((item) => item.id), ['beginner_skill_page', 'beginner_skill_book']);
assert.equal(policy.getUpgradeRequirement(3).chapter, 1, 'Lv3 to Lv4 remains a chapter-one upgrade');
assert.equal(policy.getUpgradeRequirement(4).chapter, 2, 'Lv4 to Lv5 requires chapter two');
assert.equal(policy.getUpgradeRequirement(5).chapter, 3, 'Lv5 to Lv6 requires chapter three');
assert.equal(policy.getUpgradeRequirement(6), null, 'Lv6 is the configured maximum');

const wrongChapterMaterials = {
  unlockedChapter: 1,
  gold: 999999,
  inventory: [
    { ...policy.MATERIALS.intermediate_skill_page, quantity: 999 },
    { ...policy.MATERIALS.intermediate_skill_book, quantity: 999 }
  ]
};
assert.equal(policy.canUpgrade(wrongChapterMaterials, 1).ok, false, 'later chapter materials cannot replace chapter-one materials');

const lockedChapter = {
  unlockedChapter: 1,
  gold: 999999,
  inventory: [
    { ...policy.MATERIALS.intermediate_skill_page, quantity: 999 },
    { ...policy.MATERIALS.intermediate_skill_book, quantity: 999 }
  ]
};
assert.equal(policy.canUpgrade(lockedChapter, 4).reason, 'chapter-locked');

const requirement = policy.getUpgradeRequirement(1);
const upgradeProgress = {
  unlockedChapter: 1,
  gold: requirement.gold,
  inventory: requirement.materials.map((material) => ({ ...material, quantity: material.amount }))
};
const success = policy.attemptUpgrade(upgradeProgress, 1, { random: () => 0 });
assert.equal(success.succeeded, true);
assert.equal(success.level, 2);
assert.equal(upgradeProgress.gold, 0);
assert.deepEqual(upgradeProgress.inventory, []);

const insufficient = { unlockedChapter: 1, gold: 0, inventory: [] };
const before = JSON.stringify(insufficient);
assert.equal(policy.attemptUpgrade(insufficient, 1, { random: () => 0 }).ok, false);
assert.equal(JSON.stringify(insufficient), before, 'failed validation consumes no resources');

const chapterOneDrops = { inventory: [] };
const drops = policy.grantChapterDrops(chapterOneDrops, 1, { isBoss: true }, { random: () => 0 });
assert.deepEqual(drops.map((item) => item.id), ['beginner_skill_page', 'beginner_skill_book']);
assert.ok(chapterOneDrops.inventory.every((item) => item.chapter === 1), 'chapter one never grants later chapter materials');

const chapterTwoDrops = { inventory: [] };
policy.grantChapterDrops(chapterTwoDrops, 2, { isBoss: true }, { random: () => 0 });
assert.ok(chapterTwoDrops.inventory.every((item) => item.chapter === 2), 'chapter two only grants chapter-two materials');

console.log('skill-upgrade-policy: assertions passed');
