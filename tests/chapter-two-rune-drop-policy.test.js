const assert = require('node:assert/strict');
const policy = require('../chapter-two-rune-drop-policy.js');

assert.deepEqual(policy.MAP_DROP_CONFIGS, {
  'black-forest-entrance': { runeId: 'rune-life', normalRate: .008 },
  'black-forest-trail': { runeId: 'rune-strength', normalRate: .008 },
  'spider-nest': { runeId: 'rune-fatal', normalRate: .005 },
  'blackstone-stronghold': { runeId: 'rune-guard', normalRate: .006 },
  'forest-altar': { runeId: 'rune-psionic', normalRate: .005 }
});
assert.deepEqual(policy.RANK_RATES, { elite: .02, boss: .08 });

for (const [mapId, config] of Object.entries(policy.MAP_DROP_CONFIGS)) {
  assert.equal(policy.getDropConfig(mapId, {}).dropRate, config.normalRate);
  assert.equal(policy.getDropConfig(mapId, { isElite: true }).dropRate, .02);
  assert.equal(policy.getDropConfig(mapId, { isBoss: true }).dropRate, .08);
  assert.equal(policy.getDropConfig(mapId, { isElite: true }).runeId, config.runeId, 'elite retains the local rune');
  assert.equal(policy.getDropConfig(mapId, { isBoss: true }).runeId, config.runeId, 'boss retains the local rune');
}
assert.equal(policy.getDropConfig('black-forest-depths', {}), null, 'depths do not drop the five base runes');
assert.equal(policy.getDropConfig('plains-depths', { isBoss: true }), null, 'chapter one never drops runes');

const progress = { inventory: [] };
const first = policy.grantRuneDrop(progress, 'black-forest-trail', { id: 'trailWolf' }, { random: () => .00799 });
assert.equal(first.id, 'rune-strength');
assert.equal(first.quantity, 1);
assert.equal(progress.inventory[0].quantity, 1);
policy.grantRuneDrop(progress, 'black-forest-trail', { id: 'blackstoneCenturion', isBoss: true }, { random: () => .0799 });
assert.equal(progress.inventory[0].quantity, 2, 'duplicate runes stack');
assert.equal(policy.grantRuneDrop(progress, 'black-forest-trail', {}, { random: () => .008 }), null, 'normal rate boundary does not drop');
assert.equal(policy.grantRuneDrop(progress, 'black-forest-depths', { isBoss: true }, { random: () => 0 }), null, 'even a depths boss cannot roll a base rune');

console.log('chapter-two-rune-drop-policy: assertions passed');
