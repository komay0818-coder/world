const assert = require('node:assert/strict');
const policy = require('../village-upgrade-policy.js');

function progressWith(materials = {}, gold = 15000) {
  return {
    gold,
    unlockedChapter: 1,
    inventory: Object.entries(materials).map(([id, quantity]) => ({ id, quantity }))
  };
}

function villageWith(id, level = 1) {
  return { buildings: { [id]: { id, level } } };
}

assert.deepEqual(policy.MAP_DROP_CONFIGS, {}, 'building policy does not roll a second copy of shared materials');

const allWolfDrops = policy.grantMapDrops({ inventory: [] }, 'wolf-den', { random: () => 0 });
assert.deepEqual(allWolfDrops, [], 'building policy leaves all material drops to the chapter material policy');
assert.deepEqual(policy.grantMapDrops({ inventory: [] }, 'wolf-den', { random: () => .25 }), [], 'drop boundary is exclusive');
assert.deepEqual(policy.grantMapDrops({ inventory: [] }, 'unknown-map', { random: () => 0 }), []);

assert.deepEqual(policy.LEVEL_TWO_COSTS.workshop.materials, { 'wolf-fur': 150, 'hard-hide': 150 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.blacksmith.materials, { 'iron-ore': 200, 'black-ore': 100 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.furnace.materials, { 'iron-ore': 150, 'black-ore': 150 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.alchemy.materials, { 'wolf-fang': 50, 'boar-tusk': 50, 'black-ore': 50 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.rune.materials, { 'black-ore': 250, 'wolf-fang': 25, 'boar-tusk': 25 });
Object.values(policy.LEVEL_TWO_COSTS).forEach((rule) => assert.equal(rule.gold, 15000));

const workshopProgress = progressWith({ 'wolf-fur': 150, 'hard-hide': 150 });
const workshopVillage = villageWith('workshop');
assert.equal(policy.canUpgrade(workshopProgress, workshopVillage, 'workshop').ok, true);
assert.deepEqual(policy.upgrade(workshopProgress, workshopVillage, 'workshop'), {
  ok: true,
  requirement: policy.LEVEL_TWO_COSTS.workshop,
  level: 2
});
assert.equal(workshopProgress.gold, 0);
assert.equal(workshopProgress.inventory.length, 0);
assert.equal(workshopVillage.buildings.workshop.level, 2);
assert.equal(policy.canUpgrade(workshopProgress, workshopVillage, 'workshop').reason, 'chapter-cap');

const insufficient = progressWith({ 'wolf-fur': 149, 'hard-hide': 150 });
const before = JSON.stringify(insufficient);
assert.equal(policy.upgrade(insufficient, villageWith('workshop'), 'workshop').reason, 'material');
assert.equal(JSON.stringify(insufficient), before, 'failed upgrades consume nothing');
assert.equal(policy.canUpgrade(progressWith({}, 14999), villageWith('workshop'), 'workshop').reason, 'gold');
assert.equal(policy.canUpgrade(progressWith(), villageWith('storage'), 'storage').reason, 'not-configured');

const buildingIds = Object.values(policy.MATERIALS).map(({ id }) => id);
assert.equal(new Set(buildingIds).size, buildingIds.length);
assert.deepEqual(buildingIds.sort(), ['black-ore', 'boar-tusk', 'hard-hide', 'iron-ore', 'wolf-fang', 'wolf-fur']);
const materialNames = Object.values(policy.MATERIALS).map(({ name }) => name);
assert.equal(new Set(materialNames).size, materialNames.length, 'one policy cannot define the same item name under different ids');
assert.equal(policy.getMaterial('wolf-fang').name, '狼牙');
assert.deepEqual(policy.normalizeMaterialInventory([
  { id: 'wolf-fur', kind: 'material', quantity: 3 }, { id: 'building-wolf-fur', kind: 'material', quantity: 2 },
  { id: 'hard-hide', kind: 'material', quantity: 4 }, { id: 'building-hard-hide', kind: 'material', quantity: 5 },
  { id: 'building-boar-tusk', kind: 'material', quantity: 6 }, { id: 'building-iron-ore', kind: 'material', quantity: 7 },
  { id: 'black-ore', kind: 'material', quantity: 8 }, { id: 'building-black-ore', kind: 'material', quantity: 9 }
]).map(({ id, quantity }) => ({ id, quantity })), [
  { id: 'wolf-fur', quantity: 5 }, { id: 'hard-hide', quantity: 9 }, { id: 'boar-tusk', quantity: 6 },
  { id: 'iron-ore', quantity: 7 }, { id: 'black-ore', quantity: 17 }
]);
assert.equal(policy.getMaterial('black-ore').name, '黑礦石');
assert.equal(policy.getMaterial('unknown'), null);
assert.deepEqual(policy.CHAPTER_LEVEL_CAPS, { 1: 2, 2: 3 });

console.log('village-upgrade-policy: assertions passed');
