const assert = require('node:assert/strict');
const policy = require('../chapter-three-material-drop-policy.js');

const materialIds = Object.values(policy.MATERIALS).map((material) => material.id);
assert.deepEqual(materialIds, [
  'redrock-ore', 'wasteland-thick-hide', 'vulture-hard-feather', 'skullcrusher-iron-scrap',
  'warpattern-cloth', 'warbeast-fang', 'ancient-runestone', 'temple-core-fragment'
]);
assert.equal(materialIds.includes('weapon-core'), false, '武器之核不可進入一般材料池');

function rolls(...values) { let index = 0; return () => values[index++] ?? .999999; }

assert.deepEqual(policy.rollDrops('redrock-wastes-entrance', { id: 'wasteland-hyena' }, () => .2499).map((drop) => drop.id), ['wasteland-thick-hide']);
assert.deepEqual(policy.rollDrops('redrock-wastes-entrance', { id: 'wasteland-hyena' }, () => .25), [], '普通掉落率使用排他上限');
assert.equal(policy.rollDrops('redrock-wastes-entrance', { id: 'redrock-giant-lizard' })[0].quantity, 2);
const eliteBoth = policy.rollDrops('skullcrusher-war-camp', { id: 'skullcrusher-champion' }, rolls(.99, .2499));
assert.deepEqual(eliteBoth.map(({ id, quantity }) => [id, quantity]), [['skullcrusher-iron-scrap', 1], ['warbeast-fang', 1]]);
assert.deepEqual(policy.rollDrops('skullcrusher-war-camp', { id: 'skullcrusher-champion' }, rolls(.99, .25)).map((drop) => drop.id), ['skullcrusher-iron-scrap']);
const bossBoth = policy.rollDrops('bloodwar-wastes', { id: 'skullcrusher-vanguard-commander' }, rolls(.99, .4999));
assert.deepEqual(bossBoth.map(({ id, quantity }) => [id, quantity]), [['skullcrusher-iron-scrap', 2], ['warpattern-cloth', 1]]);
assert.equal(policy.MONSTER_DROP_CONFIGS['redrock-temple-final-boss'], undefined, '最終 Boss 本批不建立掉落');

const progress = { inventory: [] };
policy.grantMaterialDrops(progress, 'redrock-temple', { id: 'temple-guardian' }, { random: rolls(0, 0) });
policy.grantMaterialDrops(progress, 'redrock-temple', { id: 'temple-guardian' }, { random: rolls(0, 0) });
assert.deepEqual(progress.inventory.map(({ id, quantity }) => [id, quantity]), [['ancient-runestone', 2], ['temple-core-fragment', 2]]);
console.log('chapter-three-material-drop-policy: assertions passed');
