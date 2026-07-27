const assert = require('assert');
const policy = require('../collectible-policy.js');

const expectedMonsterIds = [
  'plainsRabbit', 'plainsWolfPup', 'plainsSlime', 'plainsGoblinYoung', 'lostGoblin',
  'denForestWolf', 'ragingWolf', 'greatfangWolf', 'boarPiglet', 'forestBoar',
  'irritableBoar', 'boarKing', 'goblin', 'goblinScout', 'goblinWarrior',
  'goblinSlinger', 'goblinShaman', 'goblinGuard', 'goblinCaptain',
  'goblinTreasureChest', 'goblinHighChief', 'wolf', 'boar', 'goblinOverlord',
  'wolfAlpha', 'boarTyrant', 'goblinKing', 'nightGoblin', 'shadowWolf', 'thornBoar',
  'forestShaman', 'moonfangAlpha', 'thornbackTyrant', 'forestGuardian',
  'rootExecutioner', 'altarNightblade', 'moonboneSentinel', 'blightOracle',
  'eclipseSovereign', 'highlandWolf', 'rockbackBoar', 'blackstoneScout',
  'grasslandVulture', 'blackstoneRaider', 'wanderingBlackKnight', 'blackstoneLeader'
];

const catalog = policy.COLLECTIBLE_CATALOG;
assert.deepEqual(Object.keys(catalog).sort(), expectedMonsterIds.sort(), 'every current monster has exactly one collectible');
assert.equal(new Set(Object.values(catalog).map((item) => item.id)).size, expectedMonsterIds.length, 'all collectible IDs are unique');
assert.equal(new Set(Object.values(catalog).map((item) => item.name)).size, expectedMonsterIds.length, 'all collectible names are unique');
Object.values(catalog).forEach((item) => {
  assert.ok(item.source, `${item.id} has a monster source`);
  assert.ok(item.description, `${item.id} has a bonus description`);
});

const currentId = catalog.plainsRabbit.id;
assert.deepEqual(Object.keys(policy.removeLegacyCollectibles({
  'goblin-badge': { attack: 99 },
  [currentId]: catalog.plainsRabbit
})), [currentId], 'legacy collectibles and their bonuses are removed from saves');

console.log('collectible-policy: 96 assertions passed');
