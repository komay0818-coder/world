const assert = require('assert');
const policy = require('../chapter-one-level-policy');

let assertions = 0;
function check(actual, expected, message) {
  assert.deepStrictEqual(actual, expected, message);
  assertions += 1;
}
function ok(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const expectedRanges = {
  'plains-entrance': { normal: [1, 3], elite: [4, 4], boss: [] },
  'wolf-den': { normal: [3, 5], elite: [6, 6], boss: [7, 7] },
  'boar-woods': { normal: [6, 8], elite: [9, 9], boss: [10, 10] },
  'goblin-camp': { normal: [8, 10], elite: [11, 11], boss: [12, 12] },
  'plains-depths': { normal: [12, 14], elite: [15, 15], boss: [15, 15] }
};

Object.entries(expectedRanges).forEach(([mapId, expected]) => {
  const profiles = Object.values(policy.MONSTER_PROFILES[mapId]);
  const levelsFor = (predicate) => profiles.filter(predicate).flatMap((profile) => profile.level);
  const rangeFor = (levels) => levels.length ? [Math.min(...levels), Math.max(...levels)] : [];
  check(rangeFor(levelsFor((profile) => !profile.isElite && !profile.isBoss)), expected.normal, `${mapId} normal range`);
  check(rangeFor(levelsFor((profile) => profile.isElite)), expected.elite, `${mapId} elite range`);
  check(rangeFor(levelsFor((profile) => profile.isBoss)), expected.boss, `${mapId} boss range`);
});

Object.values(policy.MONSTER_PROFILES).flatMap(Object.values).forEach((profile) => {
  ['level', 'baseHp', 'baseAttack', 'baseDefense', 'baseExp', 'mapId', 'monsterType', 'isElite', 'isBoss']
    .forEach((field) => ok(Object.hasOwn(profile, field), `${profile.mapId}/${profile.monsterType} has ${field}`));
});

check(policy.rollLevel('wolf-den', 'denForestWolf', 0), 4);
check(policy.rollLevel('wolf-den', 'denForestWolf', .999), 5);
check(policy.rollLevel('boar-woods', 'forestBoar', 0), 7);
check(policy.rollLevel('boar-woods', 'forestBoar', .999), 8);

const forestBoarBase = { id: 'forestBoar', evasion: 2, damageReduction: 5 };
const forestBoar7 = policy.scaleMonster(forestBoarBase, 'boar-woods', 7);
const forestBoar8 = policy.scaleMonster(forestBoarBase, 'boar-woods', 8);
ok(forestBoar8.maxHp > forestBoar7.maxHp, 'higher level raises HP');
ok(forestBoar8.attack > forestBoar7.attack, 'higher level raises attack');
ok(forestBoar8.defense > forestBoar7.defense, 'higher level raises defense');
ok(forestBoar8.xp > forestBoar7.xp, 'higher level raises EXP');

const levelOneAccuracy = 1.05;
const playerHitEntrance = policy.getPlayerHitChance(1, 1, levelOneAccuracy);
const playerHitWolf = policy.getPlayerHitChance(1, 4, levelOneAccuracy);
const playerHitBoar = policy.getPlayerHitChance(1, 7, levelOneAccuracy);
const playerHitNearLevel = policy.getPlayerHitChance(7, 7, levelOneAccuracy);
ok(playerHitEntrance >= .95, 'Lv1 has reliable accuracy at plains entrance');
ok(playerHitWolf < playerHitEntrance && playerHitWolf >= .75, 'Lv1 can fight wolf den with lower efficiency');
ok(playerHitBoar < playerHitWolf && playerHitBoar <= .65, 'Lv1 has inadequate accuracy in boar woods');
ok(playerHitNearLevel >= .95, 'accuracy recovers near monster level');

const monsterHitEntrance = policy.getMonsterHitChance(1, 1, .05);
const monsterHitWolf = policy.getMonsterHitChance(4, 1, .05);
const monsterHitBoar = policy.getMonsterHitChance(7, 1, .05);
ok(monsterHitEntrance < monsterHitWolf, 'wolf den monsters hit Lv1 more reliably');
ok(monsterHitWolf < monsterHitBoar, 'boar woods monsters hit Lv1 more reliably than wolf den');

policy.CHAPTER_MAP_IDS.forEach((mapId) => check(policy.canEnterMap(mapId), true, `${mapId} has no level gate`));

console.log(`chapter-one-level-policy: ${assertions} assertions passed`);
