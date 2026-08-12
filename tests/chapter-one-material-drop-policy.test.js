const assert = require('node:assert/strict');
const policy = require('../chapter-one-material-drop-policy.js');

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

assert.deepEqual(Object.values(policy.MATERIALS).map((item) => item.id), [
  'wolf-fur', 'wolf-fang', 'hard-hide', 'boar-tusk', 'iron-ore', 'black-ore'
]);
Object.values(policy.MATERIALS).forEach((material) => {
  assert.equal(material.kind, 'material');
});
assert.equal(policy.MATERIALS.blackOre.materialType, 'special-crafting');
Object.values(policy.MATERIALS).filter((material) => material.id !== 'black-ore')
  .forEach((material) => assert.equal(material.materialType, 'monster-crafting'));
assert.equal(policy.MAP_DROP_CONFIGS['wolf-den'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['wolf-den'][1].dropRate, .05);
assert.equal(policy.MAP_DROP_CONFIGS['boar-woods'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['boar-woods'][1].dropRate, .05);
assert.equal(policy.MAP_DROP_CONFIGS['goblin-camp'][0].dropRate, .25);
assert.equal(policy.MAP_DROP_CONFIGS['plains-depths'], undefined, 'plains depths intentionally has no crafting material drops');
assert.match(policy.MATERIALS.blackOre.description, /只由.*黑石系列怪物掉落/, 'black ore description does not imply a map-wide drop');
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneScout[0].dropRate, .10);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneRaider[0].dropRate, .30);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneLeader[0].dropRate, 1);
assert.equal(policy.MONSTER_DROP_CONFIGS.blackstoneLeader[0].amount, 2);

const wolfProgress = { inventory: [] };
const wolfDrops = policy.grantMaterialDrops(wolfProgress, 'wolf-den', {}, { random: sequence([.24, .049]) });
assert.deepEqual(wolfDrops.map((item) => item.id), ['wolf-fur', 'wolf-fang']);
assert.deepEqual(wolfProgress.inventory.map((item) => [item.id, item.quantity]), [['wolf-fur', 1], ['wolf-fang', 1]]);
policy.grantMaterialDrops(wolfProgress, 'wolf-den', {}, { random: sequence([0, .99]) });
assert.equal(wolfProgress.inventory.find((item) => item.id === 'wolf-fur').quantity, 2, 'repeat drops stack by item id');
assert.equal(wolfProgress.inventory.find((item) => item.id === 'wolf-fang').quantity, 1);

const boarProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(boarProgress, 'boar-woods', {}, { random: sequence([0, 0]) }).map((item) => item.id), ['hard-hide', 'boar-tusk']);
const goblinProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(goblinProgress, 'goblin-camp', {}, { random: sequence([0]) }).map((item) => item.id), ['iron-ore']);

const scoutProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(scoutProgress, 'plains-depths', { id: 'blackstoneScout' }, { random: sequence([.099]) }).map((item) => [item.id, item.quantity]), [['black-ore', 1]]);
assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'plains-depths', { id: 'blackstoneScout' }, { random: sequence([.10]) }), [], 'scout boundary roll does not drop');
assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'plains-depths', { id: 'blackstoneRaider' }, { random: sequence([.299]) }).map((item) => item.id), ['black-ore']);
const leaderProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(leaderProgress, 'plains-depths', { id: 'blackstoneLeader' }, { random: sequence([.999]) }).map((item) => [item.id, item.quantity]), [['black-ore', 2]]);
assert.equal(leaderProgress.inventory.find((item) => item.id === 'black-ore').quantity, 2);
['highlandWolf', 'rockbackBoar', 'grasslandVulture', 'wanderingBlackKnight'].forEach((monsterId) => {
  assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'plains-depths', { id: monsterId }, { random: sequence([0]) }), [], `${monsterId} is not a black ore source`);
});
assert.deepEqual(Object.keys(policy.MONSTER_DROP_CONFIGS).sort(), ['blackstoneLeader', 'blackstoneRaider', 'blackstoneScout'], 'only blackstone monsters are configured as black ore sources');
assert.deepEqual(policy.grantMaterialDrops({ inventory: [] }, 'black-forest', { id: 'blackstoneLeader' }, { random: sequence([0]) }), [], 'black ore only drops in plains depths');

const noDropProgress = { inventory: [] };
assert.deepEqual(policy.grantMaterialDrops(noDropProgress, 'wolf-den', {}, { random: sequence([.25, .05]) }), [], 'rolls at the configured boundary do not drop');
assert.deepEqual(noDropProgress.inventory, []);
assert.deepEqual(JSON.parse(JSON.stringify(wolfProgress)), wolfProgress, 'stacked material inventory survives JSON save and load unchanged');

console.log('chapter-one-material-drop-policy: assertions passed');
