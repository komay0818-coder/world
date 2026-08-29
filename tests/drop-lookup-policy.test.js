const assert = require('assert');
const DropLookupPolicy = require('../drop-lookup-policy.js');
const MaterialPolicy = require('../chapter-one-material-drop-policy.js');
const ChapterTwoMaterialPolicy = require('../chapter-two-material-drop-policy.js');
const RecipePolicy = require('../chapter-one-recipe-drop-policy.js');
const ChapterTwoRecipePolicy = require('../chapter-two-recipe-drop-policy.js');
const SpecialEquipmentPolicy = require('../chapter-two-special-equipment-policy.js');
const SkillPolicy = require('../skill-upgrade-policy.js');
const BossPolicy = require('../chapter-boss-drop-policy.js');

const normalLoot = { equipmentDropRate: .25, rarityWeights: { common: 60, uncommon: 40 } };
const bossLoot = { equipmentDropRate: 1, rarityWeights: { common: 20, uncommon: 80 } };
const maps = [
  { id: 'wolf-den', name: '狼穴', chapter: 1, regionOf: 'beginner-plains', implemented: true },
  { id: 'plains-depths', name: '平原深處', chapter: 1, regionOf: 'beginner-plains', implemented: true },
  { id: 'black-forest-trail', name: '黑森林小徑', chapter: 2, regionOf: 'black-forest', implemented: true },
  { id: 'forest-altar', name: '森林祭壇', chapter: 2, regionOf: 'black-forest', implemented: true }
];
const monsters = {
  denForestWolf: { id: 'denForestWolf', name: '森林狼', lootConfig: normalLoot },
  greatfangWolf: { id: 'greatfangWolf', name: '巨牙狼', isBoss: true, lootConfig: bossLoot },
  blackstoneLeader: { id: 'blackstoneLeader', name: '黑石首領', isBoss: true, lootConfig: bossLoot },
  wanderingBlackKnight: { id: 'wanderingBlackKnight', name: '流浪黑騎士', isElite: true, lootConfig: normalLoot },
  trailWolf: { id: 'trailWolf', name: '黑森林狼', lootConfig: { equipmentDropRate: .25, rarityWeights: { uncommon: 25, rare: 75 } } },
  blackstoneTrailScout: { id: 'blackstoneTrailScout', name: '黑石斥候', lootConfig: { equipmentDropRate: .25, rarityWeights: { uncommon: 25, rare: 75 } } },
  blackstoneCenturion: { id: 'blackstoneCenturion', name: '黑石百夫長', isBoss: true, lootConfig: bossLoot },
  fallenDruid: { id: 'fallenDruid', name: '墮落德魯伊', isElite: true, lootConfig: normalLoot }
};
const mapPools = {
  'wolf-den': { normal: ['denForestWolf'], boss: ['greatfangWolf'] },
  'plains-depths': { elite: ['wanderingBlackKnight'], boss: ['blackstoneLeader'] },
  'black-forest-trail': { normal: ['trailWolf', 'blackstoneTrailScout'], boss: ['blackstoneCenturion'] },
  'forest-altar': { elite: ['fallenDruid'] }
};
const items = DropLookupPolicy.buildIndex({ maps, mapPools, monsters, materialPolicies: [MaterialPolicy, ChapterTwoMaterialPolicy], recipePolicies: [RecipePolicy, ChapterTwoRecipePolicy], skillPolicy: SkillPolicy, bossPolicy: BossPolicy, specialEquipmentPolicy: SpecialEquipmentPolicy });

const wolfFang = items.find((item) => item.id === 'wolf-fang');
assert(wolfFang, '狼牙應由現有材料掉落設定建立索引');
assert(wolfFang.sources.some((source) => source.monsterId === 'denForestWolf' && source.rate === .05));
assert(wolfFang.sources.some((source) => source.monsterId === 'greatfangWolf' && source.rate === .05));

const greenRecipe = items.find((item) => item.id === 'recipe-green-wrist');
assert.strictEqual(greenRecipe.sources[0].rate, 1 / 3, 'Boss 必掉三選一配方應顯示單件 1/3 機率');
const rareRecipe = items.find((item) => item.id === 'recipe-black-knight-rare-shoulders');
assert.strictEqual(rareRecipe.sources[0].rate, .10);
const chapterOneBlue = items.find((item) => item.id === 'chapter-1-blue-equipment');
assert(chapterOneBlue.sources.some((source) => source.monsterId === 'wanderingBlackKnight' && source.rate === .07));
assert(chapterOneBlue.sources.some((source) => source.monsterId === 'blackstoneLeader' && source.rate === .10));

const beginnerBook = items.find((item) => item.id === 'beginner_skill_book');
assert(beginnerBook.sources.every((source) => monsters[source.monsterId].isBoss), '技能書只應列出 Boss');
const intermediatePage = items.find((item) => item.id === 'intermediate_skill_page');
assert(intermediatePage.sources.some((source) => source.monsterId === 'trailWolf' && source.rate === .08));

const blue = items.find((item) => item.id === 'equipment-rare');
assert(blue.sources.some((source) => source.monsterId === 'trailWolf' && Math.abs(source.rate - .1875) < 1e-9));
assert.strictEqual(DropLookupPolicy.filterItems(items, '狼牙', 'material').length, 1);
assert(DropLookupPolicy.filterItems(items, '', 'equipment', 'black-forest-trail').length > 0);
const blackIron = items.find((item) => item.id === 'black-iron-ore');
assert(blackIron.sources.some((source) => source.mapId === 'black-forest-trail' && source.monsterId === 'blackstoneTrailScout' && source.rate === .10));
assert.strictEqual(DropLookupPolicy.filterItems(items, '黑鐵礦石', 'material', 'wolf-den').length, 0, '其他地圖不顯示第二章材料');
assert.strictEqual(DropLookupPolicy.filterItems(items, '黑鐵礦石', 'material', 'black-forest-trail').length, 1);
const greenWristRecipe = items.find((item) => item.id === 'recipe-chapter2-green-wrist');
assert(greenWristRecipe.sources.some((source) => source.mapId === 'black-forest-trail' && source.monsterId === 'blackstoneCenturion' && source.rate === .01));
const fallenThornWand = items.find((item) => item.id === 'fallen-thorn-wand');
assert(fallenThornWand.sources.some((source) => source.mapId === 'forest-altar' && source.monsterId === 'fallenDruid' && source.rate === null));
assert.match(fallenThornWand.typeLabel, /掉落機率待定/);
assert.strictEqual(DropLookupPolicy.filterItems(items, '墮落荊棘魔杖', 'equipment', 'black-forest-trail').length, 0);
assert.strictEqual(DropLookupPolicy.filterItems(items, '墮落荊棘魔杖', 'equipment', 'forest-altar').length, 1);
assert.strictEqual(DropLookupPolicy.percent(.333333), '33.33%');

console.log('drop lookup policy tests passed');
