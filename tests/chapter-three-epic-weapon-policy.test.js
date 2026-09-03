const assert = require('node:assert/strict');
const policy = require('../chapter-three-epic-weapon-policy.js');
const fragments = require('../chapter-three-weapon-recipe-fragment-policy.js');

assert.equal(Object.keys(policy.WEAPONS).length, 8);
assert.equal(Object.keys(policy.WEAPON_CORES).length, 8);
Object.values(policy.WEAPON_CORES).forEach((core) => {
  assert.equal(core.sourceStatus, 'pre-job-trial-chest');
  assert.equal(core.sourceName, '轉職前試煉寶箱');
});
assert.equal(policy.GOLD_COST, 75000);
assert.deepEqual(policy.COMMON_MATERIALS, { 'redrock-ore': 40, 'skullcrusher-iron-scrap': 35, 'warbeast-fang': 10, 'ancient-runestone': 12, 'temple-core-fragment': 6 });

Object.values(policy.WEAPONS).forEach((template, index) => {
  const item = policy.createWeapon(template.id, { uniqueId: `test-${index}`, random: () => 0 });
  assert.equal(item.quality, 'epic');
  assert.equal(item.fixedAffixes.length, 2);
  assert.equal(item.randomAffixes.length, 2);
  assert.equal(item.affixes.length, 4);
  assert.ok(item.specialAbility);
  assert.ok(item.sockets >= 0 && item.sockets <= 3);
});

const template = policy.WEAPONS.redrockWarblade;
const costs = { [fragments.FORGING_RECIPE.id]: 1, [template.coreId]: 1, ...policy.COMMON_MATERIALS };
const progress = { gold: 80000, inventory: Object.entries(costs).map(([id, quantity]) => ({ id, kind: 'material', quantity })) };
const crafted = policy.craftWeapon(progress, template.id, { uniqueId: 'crafted', random: () => 0 });
assert.equal(crafted.ok, true);
assert.equal(progress.gold, 5000);
Object.keys(costs).forEach((id) => assert.equal(progress.inventory.some((item) => item.id === id), false));
assert.equal(progress.inventory.at(-1).templateId, template.id);

const missing = { gold: 80000, inventory: [] };
const snapshot = JSON.stringify(missing);
assert.equal(policy.craftWeapon(missing, template.id).ok, false);
assert.equal(JSON.stringify(missing), snapshot, 'failed crafting is atomic');

const member = (ability) => ({ progress: { equipment: { weapon: { specialAbility: { id: ability } } } }, skillCooldowns: { fireball: 10000, blizzard: 9000 }, resourceCurrent: 50, resourceMax: 100 });
const combo = member('warblade_combo');
for (let i = 0; i < 3; i += 1) assert.equal(policy.resolveBasicHit(combo, { hit: true }).combo, false);
assert.equal(policy.resolveBasicHit(combo, { hit: true }).combo, true);
const shred = member('armor_shatter'), enemyState = {};
policy.resolveBasicHit(shred, { hit: true, enemyState, now: 1000, random: () => .199 });
assert.equal(enemyState.armorShatterUntil, 6000);
const rhythm = member('hunting_rhythm');
for (let i = 0; i < 7; i += 1) policy.resolveBasicHit(rhythm, { hit: true, now: 1000 });
assert.equal(policy.getHuntingRhythmSpeed(rhythm, 4999), .15);
assert.equal(policy.getHuntingRhythmSpeed(rhythm, 5000), 0);
const cycle = member('rune_cycle');
assert.equal(policy.resolveRuneCycle(cycle, 10, 'fireball', 5000), false);
policy.resolveRuneCycle(cycle, 10, 'fireball', 5000);
assert.equal(policy.resolveRuneCycle(cycle, 10, 'fireball', 5000), true);
assert.equal(cycle.skillCooldowns.fireball, 10000, 'current skill cooldown is unchanged');
assert.equal(cycle.skillCooldowns.blizzard, 8200, 'other remaining cooldown is multiplied by 80%');
const healer = member('holy_afterglow'), target = { alive: true, currentHp: 50, maxHp: 100 };
policy.createAfterglow(healer, target, 50, 0);
policy.tickAfterglow(target, 1000);
assert.equal(target.currentHp, 53);
console.log('chapter-three-epic-weapon-policy: assertions passed');
