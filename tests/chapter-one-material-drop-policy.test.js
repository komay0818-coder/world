const assert = require('node:assert/strict');
const policy = require('../chapter-one-material-drop-policy.js');

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

assert.deepEqual(Object.values(policy.MATERIALS).map((item) => item.id), [
  'wolf-fur', 'wolf-fang', 'hard-hide', 'boar-tusk', 'iron-ore'
]);
Object.values(policy.MATERIALS).forEach((material) => {
  assert.equal(material.kind, 'material');
  assert.equal(material.materialType, 'monster-crafting');
});
assert.equal(policy.MAP_DROP_CONFIGS['wolf-den'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['wolf-den'][1].dropRate, .05);
assert.equal(policy.MAP_DROP_CONFIGS['boar-woods'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['boar-woods'][1].dropRate, .05);
assert.equal(policy.MAP_DROP_CONFIGS['goblin-camp'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['plains-depths'], undefined, 'plains depths intentionally has no crafting material drops');

const wolfProgress = { inventory: [] };
const wolfDrops = policy.grantMaterialDrops(wolfProgress, 'wolf-den', { random: sequence([.24, .049]) });
assert.deepEqual(wolfDrops.map((item) => item.id), ['wolf-fur', 'wolf-fang']);
assert.deepEqual(wolfProgress.inventory.map((item) => [item.id, item.quantity]), [['wolf-fur', 1], ['wolf-fang', 1]]);
policy.grantMaterialDrops(wolfProgress, 'wolf-den', { random: sequence([0, .99]) });
assert.equal(wolfProgress.inventory.find((item) => item.id === 'wolf-fur').quantity, 2, 'repeat drops stack by item id');
assert.equal(wolfProgress.inventory.find((item) => item.id === 'wolf-fang').quantity, 1);

const boarProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(boarProgress, 'boar-woods', { random: sequence([0, 0]) }).map((item) => item.id), ['hard-hide', 'boar-tusk']);
const goblinProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(goblinProgress, 'goblin-camp', { random: sequence([0]) }).map((item) => item.id), ['iron-ore']);
assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'plains-depths', { random: sequence([0]) }), []);
assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'black-forest', { random: sequence([0]) }), []);

const noDropProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(noDropProgress, 'wolf-den', { random: sequence([.25, .05]) }), [], 'rolls at the configured boundary do not drop');
assert.deepEqual(noDropProgress.inventory, []);
assert.deepEqual(JSON.parse(JSON.stringify(wolfProgress)), wolfProgress, 'stacked material inventory survives JSON save and load unchanged');

console.log('chapter-one-material-drop-policy: assertions passed');
