const assert = require('node:assert/strict');
const VillagePolicy = require('../village-policy.js');

const buildingIds = ['furnace', 'alchemy', 'workshop', 'blacksmith', 'rune', 'storage', 'shop'];
assert.deepEqual(Object.keys(VillagePolicy.BUILDING_DEFINITIONS), buildingIds, 'V1 exposes exactly the seven requested buildings');

const defaults = VillagePolicy.createDefaultVillageData();
assert.equal(defaults.version, 1);
assert.equal(defaults.level, 1);
assert.deepEqual(Object.keys(defaults.buildings), buildingIds);
assert.ok(Object.values(defaults.buildings).every((building) => building.level === 1 && building.unlocked === true));

const legacy = VillagePolicy.normalizeVillageData(undefined);
assert.deepEqual(legacy, defaults, 'a legacy save without village data receives safe defaults');

const repaired = VillagePolicy.normalizeVillageData({
  version: 3,
  level: -4,
  futureVillageField: { retained: true },
  buildings: {
    furnace: { level: 999, futureCost: { gold: 50 } },
    alchemy: { level: 0, unlocked: false },
    unknownBuilding: { level: 8 }
  }
});
assert.equal(repaired.version, 3, 'future schema versions remain readable');
assert.equal(repaired.level, 1, 'invalid village level is repaired');
assert.equal(repaired.buildings.furnace.level, 10, 'building level is capped by its definition');
assert.deepEqual(repaired.buildings.furnace.futureCost, { gold: 50 }, 'known building state keeps future extension fields');
assert.equal(repaired.buildings.alchemy.unlocked, false, 'saved unlock state is retained');
assert.equal(repaired.buildings.shop.level, 1, 'missing buildings are added automatically');
assert.equal(repaired.buildings.unknownBuilding, undefined, 'unknown building ids do not enter the active V1 roster');
assert.deepEqual(repaired.futureVillageField, { retained: true }, 'future village metadata is retained');

const furnace = VillagePolicy.getVillageBuildingData(repaired, 'furnace');
assert.equal(furnace.name, '熔爐');
assert.equal(furnace.level, 10);
assert.equal(furnace.feature, 'salvage');
const magicTower = VillagePolicy.getVillageBuildingData(repaired, 'rune');
assert.equal(magicTower.name, '魔法塔');
assert.equal(magicTower.feature, 'magic-synthesis');
assert.equal(VillagePolicy.getVillageBuildingData(repaired, 'missing'), null);

console.log('village-policy: assertions passed');
