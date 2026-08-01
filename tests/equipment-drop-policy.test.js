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
assert.deepEqual(normalEnemy.lootConfig.rarityWeights, { common: 90, uncommon: 10 });
assert.equal(eliteEnemy.lootConfig.equipmentDropRate, .40);
assert.equal(bossEnemy.lootConfig.equipmentDropRate, 1);
assert.deepEqual(bossEnemy.lootConfig.rarityWeights, { common: 40, uncommon: 60 });
assert.notDeepEqual(normalEnemy.lootConfig.rarityWeights, bossEnemy.lootConfig.rarityWeights, 'monster ranks can use distinct rarity tables');

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
assert.equal(green.affixes.length, 1, 'green drops receive one permanent compatible affix');
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
