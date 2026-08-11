const assert = require('assert');
const dropPolicy = require('../equipment-drop-policy.js');
const equipmentPolicy = require('../equipment-policy.js');

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

const normalEnemy = { id: 'plainsRabbit', lootConfig: dropPolicy.TEST_LOOT_CONFIGS.normal };
const eliteEnemy = { id: 'ragingWolf', isElite: true, lootConfig: dropPolicy.TEST_LOOT_CONFIGS.elite };
const bossEnemy = { id: 'greatfangWolf', isBoss: true, lootConfig: dropPolicy.TEST_LOOT_CONFIGS.boss };

assert.equal(normalEnemy.lootConfig.equipmentDropRate, .25);
assert.deepEqual(normalEnemy.lootConfig.rarityWeights, { common: 60, uncommon: 40 });
assert.equal(eliteEnemy.lootConfig.equipmentDropRate, .40);
assert.equal(bossEnemy.lootConfig.equipmentDropRate, 1);
assert.deepEqual(eliteEnemy.lootConfig.rarityWeights, { common: 25, uncommon: 75 });
assert.deepEqual(bossEnemy.lootConfig.rarityWeights, { common: 20, uncommon: 80 });
assert.notDeepEqual(normalEnemy.lootConfig.rarityWeights, bossEnemy.lootConfig.rarityWeights, 'monster ranks can use distinct rarity tables');

const configuredMonsters = dropPolicy.applyDefaultLootConfigs({
  normal: { id: 'normal' },
  rare: { id: 'rare', isRare: true },
  elite: { id: 'elite', isElite: true },
  boss: { id: 'boss', isBoss: true },
  custom: { id: 'custom', lootConfig: { equipmentDropRate: .01, rarityWeights: { common: 1 }, equipmentPools: ['custom'] } }
});
assert.equal(configuredMonsters.normal.lootConfig, dropPolicy.TEST_LOOT_CONFIGS.normal);
assert.equal(configuredMonsters.rare.lootConfig, dropPolicy.TEST_LOOT_CONFIGS.normal, 'rare monsters use the normal-rank baseline until a rare profile is added');
assert.equal(configuredMonsters.elite.lootConfig, dropPolicy.TEST_LOOT_CONFIGS.elite);
assert.equal(configuredMonsters.boss.lootConfig, dropPolicy.TEST_LOOT_CONFIGS.boss);
assert.equal(configuredMonsters.custom.lootConfig.equipmentDropRate, .01, 'per-monster loot overrides remain supported');
assert.notEqual(configuredMonsters.normal, normalEnemy, 'configuration returns independent monster objects');

const noDropProgress = { inventory: [] };
assert.equal(dropPolicy.grantEquipmentDrop(noDropProgress, normalEnemy, { random: sequence([.99]) }), null);
assert.equal(noDropProgress.inventory.length, 0);

const commonProgress = { inventory: [] };
const common = dropPolicy.grantEquipmentDrop(commonProgress, normalEnemy, {
  random: sequence([0, 0, 0, 0]),
  instanceIdFactory: () => 'eq-common-1',
  obtainedAt: 1234
});
assert.ok(common, 'monster death can grant an equipment instance');
assert.equal(commonProgress.inventory[0], common, 'the generated instance enters the existing inventory array');
assert.equal(common.instanceId, 'eq-common-1');
assert.equal(common.id, common.instanceId, 'legacy inventory actions use the unique instance id');
assert.ok(common.templateId);
assert.equal(common.rarity, 'common');
assert.equal(common.quality, 'common');
assert.deepEqual(common.affixes, []);
assert.equal(common.sockets, 0);
assert.equal(common.obtainedFrom, 'plainsRabbit');
assert.equal(common.obtainedAt, 1234);
assert.ok(common.baseStats && typeof common.baseStats === 'object');
assert.deepEqual(common.allowedClasses, common.allowedJobs, 'new schema and current equip checks share the same class restrictions');

const greenProgress = { inventory: [] };
const green = dropPolicy.grantEquipmentDrop(greenProgress, eliteEnemy, {
  random: sequence([0, .999, 0, 0]),
  instanceIdFactory: () => 'eq-green-1',
  obtainedAt: 2345
});
assert.equal(green.rarity, 'uncommon');
assert.equal(green.fixedAffixes.length, 1, 'green drops receive one fixed affix');
assert.equal(green.randomAffixes.length, 2, 'green drops receive two random affix types');
assert.equal(green.affixes.length, 3);
assert.equal(green.affixChapter, 1, 'drops default to chapter one affix unlocks');
assert.ok(['weapon', 'armor', 'accessory'].includes(require('../equipment-affix-policy.js').getEquipmentGroup(green)));

const firstCopyProgress = { inventory: [] };
const firstCopy = dropPolicy.grantEquipmentDrop(firstCopyProgress, bossEnemy, {
  random: sequence([0, 0, 0, 0]), instanceIdFactory: () => 'eq-copy-a'
});
const secondCopy = dropPolicy.grantEquipmentDrop(firstCopyProgress, bossEnemy, {
  random: sequence([0, 0, 0, 0]), instanceIdFactory: () => 'eq-copy-b'
});
assert.equal(firstCopy.templateId, secondCopy.templateId, 'the same template can drop repeatedly');
assert.notEqual(firstCopy.instanceId, secondCopy.instanceId, 'repeated drops have independent ids');
firstCopy.affixes.push({ id: 'local-test' });
assert.notDeepEqual(firstCopy.affixes, secondCopy.affixes, 'instances do not share mutable affix arrays');

const saved = JSON.stringify(greenProgress);
assert.deepEqual(JSON.parse(saved).inventory[0], green, 'save/load JSON preserves the complete dropped item');

const warriorOnly = dropPolicy.createEquipmentDropInstance(equipmentPolicy.ARMOR_CATALOG.recruitPlateArmor, {
  rarity: 'common', instanceId: 'eq-warrior-only', obtainedAt: 1
});
assert.deepEqual(warriorOnly.allowedClasses, ['warrior'], 'armor instances expose their resolved class restriction');
assert.deepEqual(equipmentPolicy.getEquipSlots(warriorOnly, 'warrior'), ['armor']);
assert.deepEqual(equipmentPolicy.getEquipSlots(warriorOnly, 'mage'), [], 'incompatible classes still cannot equip the drop');

const backpackRepairWarnings = [];
const repairedProgress = {};
const repairedDrop = dropPolicy.grantEquipmentDrop(repairedProgress, bossEnemy, {
  random: sequence([0, 0, 0, 0]),
  instanceIdFactory: () => 'eq-repaired',
  warningHandler: (...args) => backpackRepairWarnings.push(args)
});
assert.ok(repairedDrop);
assert.ok(Array.isArray(repairedProgress.inventory), 'missing legacy inventory data is initialized');
assert.ok(backpackRepairWarnings.length >= 1);

const fullWarnings = [];
const fullProgress = { inventory: Object.freeze([]) };
assert.doesNotThrow(() => dropPolicy.grantEquipmentDrop(fullProgress, bossEnemy, {
  random: sequence([0, 0, 0, 0]),
  instanceIdFactory: () => 'eq-full',
  warningHandler: (...args) => fullWarnings.push(args)
}));
assert.ok(fullWarnings.some((entry) => String(entry[0]).includes('背包無法寫入')), 'an unwritable/full inventory warns without stopping combat');

const badWarnings = [];
const badOptions = { warningHandler: (...args) => badWarnings.push(args) };
assert.equal(dropPolicy.rollRarity({ common: 0, uncommon: 0 }, .5, badOptions.warningHandler), null);
assert.deepEqual(dropPolicy.getTemplatesFromPools([], badOptions.warningHandler), []);
assert.deepEqual(dropPolicy.getTemplatesFromPools(['missing_pool'], badOptions.warningHandler), []);
assert.equal(dropPolicy.createEquipmentDropInstance(null, badOptions), null);
assert.ok(badWarnings.length >= 4, 'invalid weights, pools and templates produce clear warnings');

const chapterTwoNormal = { id: 'corruptedForestWolf', mapId: 'black-forest-depths', lootConfig: dropPolicy.CHAPTER_TWO_LOOT_CONFIGS.normal };
const chapterTwoBoss = { id: 'heartOfBlackForest', mapId: 'black-forest-depths', isBoss: true, lootConfig: dropPolicy.CHAPTER_TWO_LOOT_CONFIGS.boss };
const chapterTwoGreen = dropPolicy.grantEquipmentDrop({ inventory: [] }, chapterTwoNormal, { random: sequence([0, 0, 0, 0]), instanceIdFactory: () => 'eq-c2-green' });
assert.equal(chapterTwoGreen.rarity, 'uncommon', 'chapter two never drops white equipment');
assert.equal(chapterTwoGreen.affixChapter, 2);
assert.equal(chapterTwoGreen.chapter, 2);
assert.equal(chapterTwoGreen.imageStatus, 'ready');
assert.equal(chapterTwoGreen.image, 'assets/forest-guard-longsword.png');
assert.ok(dropPolicy.CHAPTER_TWO_TEMPLATES.some((template) => template.id === chapterTwoGreen.templateId), 'chapter two uses only its exclusive series');
const chapterTwoBlue = dropPolicy.grantEquipmentDrop({ inventory: [] }, chapterTwoNormal, { random: sequence([0, .99, 0, 0]), instanceIdFactory: () => 'eq-c2-blue' });
assert.equal(chapterTwoBlue.rarity, 'rare', 'blue is the primary chapter-two quality');
const chapterTwoPurple = dropPolicy.grantEquipmentDrop({ inventory: [] }, chapterTwoBoss, { random: sequence([0, .999, 0, 0]), instanceIdFactory: () => 'eq-c2-purple' });
assert.equal(chapterTwoPurple.rarity, 'epic', 'chapter-two bosses can roll the low-rate purple tier');
assert.equal(dropPolicy.rollChapterRarity(2, { common: 100 }, 0, false, () => {}), null, 'chapter-two quality guard rejects white even in an invalid override');
const chapterTwoWeapons = dropPolicy.CHAPTER_TWO_TEMPLATES.filter((template) => template.slot === 'weapon');
assert.equal(chapterTwoWeapons.length, 14, 'chapter two includes fourteen requested weapons');
assert.deepEqual(chapterTwoWeapons.map((template) => template.name), ['林衛長劍', '傭兵闊劍', '斬木巨劍', '黑鐵重劍', '伐林戰斧', '裂骨手斧', '巨木戰斧', '破甲重斧', '毒牙匕首', '暗林短刃', '長枝獵弓', '穿林長弓', '古木魔杖', '孢子魔杖']);
chapterTwoWeapons.forEach((template) => {
  assert.equal(template.chapter, 2);
  assert.equal(template.affixChapter, 2);
  assert.ok(dropPolicy.EQUIPMENT_POOLS.black_forest_weapons.includes(template.id));
});
assert.equal(chapterTwoWeapons.find((template) => template.id === 'forest-guard-longsword').image, 'assets/forest-guard-longsword.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'forest-guard-longsword').imageStatus, 'ready');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'mercenary-broadsword').image, 'assets/mercenary-broadsword.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'mercenary-broadsword').imageStatus, 'ready');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'woodcutter-greatsword').image, 'assets/woodcutter-greatsword.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'woodcutter-greatsword').imageStatus, 'ready');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'black-iron-greatsword').image, 'assets/black-iron-greatsword.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'black-iron-greatsword').imageStatus, 'ready');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'forest-felling-axe').image, 'assets/forest-felling-axe.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'forest-felling-axe').imageStatus, 'ready');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'bonebreaker-hatchet').image, 'assets/bonebreaker-hatchet.png');
assert.equal(chapterTwoWeapons.find((template) => template.id === 'bonebreaker-hatchet').imageStatus, 'ready');
chapterTwoWeapons.filter((template) => !['forest-guard-longsword', 'mercenary-broadsword', 'woodcutter-greatsword', 'black-iron-greatsword', 'forest-felling-axe', 'bonebreaker-hatchet'].includes(template.id)).forEach((template) => assert.equal(template.imageStatus, 'pending'));
assert.deepEqual(equipmentPolicy.getEquipSlots(chapterTwoWeapons.find((item) => item.name === '林衛長劍'), 'assassin'), ['weapon', 'offhand']);
assert.deepEqual(equipmentPolicy.getEquipSlots(chapterTwoWeapons.find((item) => item.name === '黑鐵重劍'), 'assassin'), []);
assert.deepEqual(equipmentPolicy.getEquipSlots(chapterTwoWeapons.find((item) => item.name === '穿林長弓'), 'hunter'), ['weapon']);
assert.deepEqual(equipmentPolicy.getEquipSlots(chapterTwoWeapons.find((item) => item.name === '孢子魔杖'), 'priest'), ['weapon']);

const duplicateWarnings = [];
const duplicateProgress = { inventory: [{ id: 'duplicate', instanceId: 'duplicate' }] };
const duplicate = dropPolicy.grantEquipmentDrop(duplicateProgress, bossEnemy, {
  random: sequence([0, 0, 0, 0]),
  instanceIdFactory: () => 'duplicate',
  warningHandler: (...args) => duplicateWarnings.push(args)
});
assert.equal(duplicate, null);
assert.equal(duplicateProgress.inventory.length, 1);
assert.ok(duplicateWarnings.some((entry) => String(entry[0]).includes('重複 instanceId')));

console.log('equipment-drop-policy: assertions passed');
