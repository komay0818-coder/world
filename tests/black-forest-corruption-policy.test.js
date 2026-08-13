const assert = require('node:assert/strict');
const policy = require('../black-forest-corruption-policy.js');

assert.equal(policy.MAX_LAYERS, 6);
assert.deepEqual(policy.DROP_RATES, { normal: .10, elite: .25, boss: 1 });
assert.equal(policy.MATERIAL_COST, 20);
assert.equal(policy.GOLD_COST, 1000);
assert.equal(policy.SUCCESS_RATE, .10);
assert.deepEqual(Object.values(policy.MAP_MATERIALS).map((item) => item.name), ['森林淨化葉', '黑石破咒石', '蛛毒淨化囊', '督軍徽記碎片', '祭壇淨化結晶', '黑森林之心碎片']);

const material = policy.MAP_MATERIALS['spider-nest'];
const failed = { gold: 2000, inventory: [{ ...material, quantity: 40 }], blackForestCorruption: { initialized: true, removedLayers: 0 } };
const failure = policy.purify(failed, 'spider-nest', { random: () => .10 });
assert.equal(failure.success, false);
assert.equal(failed.gold, 1000);
assert.equal(failed.inventory[0].quantity, 20);
assert.equal(policy.getEffect(failed.blackForestCorruption).level, 6);

const success = policy.purify(failed, 'spider-nest', { random: () => .099 });
assert.equal(success.success, true);
assert.equal(failed.gold, 0);
assert.equal(failed.inventory.length, 0);
assert.equal(success.effect.level, 5);

assert.equal(policy.createMapDrop('forest-altar', {}, () => .099).quantity, 1);
assert.equal(policy.createMapDrop('forest-altar', {}, () => .10), null);
assert.equal(policy.createMapDrop('forest-altar', { isElite: true }, () => .249).quantity, 1);
assert.equal(policy.createMapDrop('forest-altar', { isElite: true }, () => .25), null);
assert.equal(policy.createMapDrop('forest-altar', { isBoss: true }, () => .999).quantity, 1);

const legacy = policy.normalizeState({ initialized: true, purifiedMapIds: ['black-forest-entrance', 'spider-nest'] });
assert.equal(policy.getEffect(legacy).level, 4, 'legacy permanent progress is retained');

console.log('black-forest-corruption-policy: assertions passed');
