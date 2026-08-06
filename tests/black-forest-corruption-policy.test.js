const assert = require('node:assert/strict');
const policy = require('../black-forest-corruption-policy.js');

assert.equal(policy.MAX_LAYERS, 6);
assert.equal(Object.keys(policy.MAP_MATERIALS).length, 6);
assert.equal(new Set(Object.values(policy.MAP_MATERIALS).map((item) => item.id)).size, 6);
assert.ok(Object.values(policy.MAP_MATERIALS).every((item) => item.dropRate === null));
const progress = { inventory: [] };
assert.deepEqual(policy.enterChapter(progress), { level: 6, attackPenalty: .48, defensePenalty: .48, accuracyPenalty: .48, maxHpLossPerSecond: .06, fullyPurified: false });
assert.deepEqual(policy.applyCombatStats({ attack: 100, defense: 50, accuracy: 1.05 }, progress.blackForestCorruption), { attack: 52, defense: 26, accuracy: .5700000000000001 });
assert.equal(policy.getHpLoss(1000, 1, progress.blackForestCorruption), 60);
for (const [index, material] of Object.values(policy.MAP_MATERIALS).entries()) {
  progress.inventory.push({ id: material.id, quantity: 1 });
  const result = policy.purify(progress, material.mapId);
  assert.equal(result.ok, true);
  assert.equal(result.effect.level, 5 - index);
  assert.equal(result.effect.attackPenalty, (5 - index) * .08);
  assert.equal(result.effect.maxHpLossPerSecond, (5 - index) * .01);
}
assert.equal(policy.getEffect(progress.blackForestCorruption).fullyPurified, true);
assert.equal(policy.purify(progress, 'black-forest-entrance').reason, 'already-purified');
const missing = { inventory: [], blackForestCorruption: { initialized: true, purifiedMapIds: [] } };
assert.equal(policy.purify(missing, 'forest-altar').reason, 'material');
assert.equal(policy.createMapDrop('forest-altar', null, () => 0), null);
assert.equal(policy.createMapDrop('forest-altar', .25, () => .249).id, 'forest-altar-purifier');
assert.equal(policy.createMapDrop('forest-altar', .25, () => .25), null);
console.log('black-forest-corruption-policy: assertions passed');
