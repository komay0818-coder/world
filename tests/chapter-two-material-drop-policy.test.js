const assert = require('node:assert/strict');
const policy = require('../chapter-two-material-drop-policy.js');

function sequence(values) {
  let index = 0;
  return () => values[index++] ?? .999999;
}

assert.deepEqual(Object.values(policy.MATERIALS).map((item) => item.name), ['黑木', '厚皮', '蜘蛛絲', '毒囊', '黑鐵礦石', '腐化結晶']);
['black-wood', 'spider-silk', 'venom-sac', 'black-iron-ore', 'corruption-crystal'].forEach((materialId) => {
  const material = Object.values(policy.MATERIALS).find((item) => item.id === materialId);
  assert.equal(material.imageStatus, 'ready');
  assert.equal(material.image, `assets/${materialId}.png?v=20260830-chapter-two-material-art-v1`);
});
assert.equal(policy.MATERIALS.hardHide.id, 'hard-hide', '第二章厚皮沿用既有同名材料 ID');
assert.deepEqual(policy.MAP_DROP_CONFIGS, {}, '不使用整張地圖的通用材料掉落');
assert.equal(policy.MONSTER_DROP_CONFIGS.witheredTreeWalker[0].dropRate, .25);
assert.equal(policy.MONSTER_DROP_CONFIGS.forestGuardianV2[0].dropRate, 1);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneStrongholdWarhound[0].materialId, 'hard-hide');
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneStrongholdWarhound.some((drop) => drop.materialId === 'black-iron-ore'), false);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstonePoisonSpider.some((drop) => drop.materialId === 'black-iron-ore'), false);
assert.equal(policy.MONSTER_DROP_CONFIGS.giantSpider.find((drop) => drop.materialId === 'venom-sac').dropRate, 1);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneStrongholdWarlord[0].amount ?? 1, 1, '黑石 Boss 只掉落一個黑鐵礦石');

const spiderProgress = { inventory: [] };
const spiderDrops = policy.grantMaterialDrops(spiderProgress, 'spider-nest', { id: 'spiderNestBlackstonePoisonSpider' }, { random: sequence([0, 0]) });
assert.deepEqual(spiderDrops.map((drop) => drop.id), ['spider-silk', 'venom-sac']);
policy.grantMaterialDrops(spiderProgress, 'spider-nest', { id: 'spiderNestBlackstonePoisonSpider' }, { random: sequence([0, 0]) });
assert.deepEqual(spiderProgress.inventory.map(({ id, quantity }) => ({ id, quantity })), [
  { id: 'spider-silk', quantity: 2 }, { id: 'venom-sac', quantity: 2 }
]);
assert.deepEqual(policy.rollDrops('spider-nest', { id: 'blackstoneVenomHunter' }, sequence([.05, .10])), [], '掉落邊界不成功');
assert.deepEqual(policy.rollDrops('plains-depths', { id: 'blackstoneTrailScout' }, () => 0), [], '第二章材料不會在第一章掉落');
assert.equal(policy.rollDrops('black-forest-trail', { id: 'blackstoneBeastmaster' }, () => .31, 1.1).length, 1, '詞綴材料 Bonus 將 30% 提高至 33%');
assert.deepEqual(policy.rollDrops('blackstone-stronghold', { id: 'blackstoneStrongholdWarlord', isBoss: true }, () => 0).map(({ id, quantity }) => ({ id, quantity })), [{ id: 'black-iron-ore', quantity: 1 }]);
assert.deepEqual(policy.rollDrops('forest-altar', { id: 'corruptedAltarGuardian', isBoss: true }, () => 0).map(({ id, quantity }) => ({ id, quantity })), [{ id: 'corruption-crystal', quantity: 1 }]);

console.log('chapter-two-material-drop-policy: assertions passed');
