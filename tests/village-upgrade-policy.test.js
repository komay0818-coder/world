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

assert.deepEqual(Object.keys(policy.MAP_DROP_CONFIGS), ['wolf-den', 'boar-woods', 'goblin-camp', 'plains-depths']);
assert.deepEqual(policy.MAP_DROP_CONFIGS['wolf-den'].map(({ dropRate }) => dropRate), [.25, .05]);
assert.deepEqual(policy.MAP_DROP_CONFIGS['boar-woods'].map(({ dropRate }) => dropRate), [.25, .05]);
assert.equal(policy.MAP_DROP_CONFIGS['goblin-camp'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['plains-depths'][0].dropRate, .25);

const allWolfDrops = policy.grantMapDrops({ inventory: [] }, 'wolf-den', { random: () => 0 });
assert.deepEqual(allWolfDrops.map(({ id }) => id), ['building-wolf-fur', 'building-wolf-fang'], 'drops depend on map only');
assert.deepEqual(policy.grantMapDrops({ inventory: [] }, 'wolf-den', { random: () => .25 }), [], 'drop boundary is exclusive');
assert.deepEqual(policy.grantMapDrops({ inventory: [] }, 'unknown-map', { random: () => 0 }), []);

assert.deepEqual(policy.LEVEL_TWO_COSTS.workshop.materials, { 'building-wolf-fur': 150, 'building-hard-hide': 150 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.blacksmith.materials, { 'building-iron-ore': 200, 'building-black-ore': 100 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.furnace.materials, { 'building-iron-ore': 150, 'building-black-ore': 150 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.alchemy.materials, { 'building-wolf-fang': 50, 'building-boar-tusk': 50, 'building-black-ore': 50 });
assert.deepEqual(policy.LEVEL_TWO_COSTS.rune.materials, { 'building-black-ore': 250, 'building-wolf-fang': 25, 'building-boar-tusk': 25 });
Object.values(policy.LEVEL_TWO_COSTS).forEach((rule) => assert.equal(rule.gold, 15000));

const workshopProgress = progressWith({ 'building-wolf-fur': 150, 'building-hard-hide': 150 });
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

const insufficient = progressWith({ 'building-wolf-fur': 149, 'building-hard-hide': 150 });
const before = JSON.stringify(insufficient);
assert.equal(policy.upgrade(insufficient, villageWith('workshop'), 'workshop').reason, 'material');
assert.equal(JSON.stringify(insufficient), before, 'failed upgrades consume nothing');
assert.equal(policy.canUpgrade(progressWith({}, 14999), villageWith('workshop'), 'workshop').reason, 'gold');
assert.equal(policy.canUpgrade(progressWith(), villageWith('storage'), 'storage').reason, 'not-configured');

const buildingIds = Object.values(policy.MATERIALS).map(({ id }) => id);
assert.ok(buildingIds.every((id) => id.startsWith('building-')), 'building materials use independent item ids');
assert.equal(new Set(buildingIds).size, buildingIds.length);
assert.equal(policy.getMaterial('building-black-ore').name, '黑礦石');
assert.equal(policy.getMaterial('unknown'), null);
assert.deepEqual(policy.CHAPTER_LEVEL_CAPS, { 1: 2, 2: 3 });

console.log('village-upgrade-policy: assertions passed');
