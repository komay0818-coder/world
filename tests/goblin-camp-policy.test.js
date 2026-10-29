const assert = require('assert');
const policy = require('../goblin-camp-policy');
const chapterPolicy = require('../chapter-one-level-policy');

let assertions = 0;
function check(actual, expected) {
  assert.deepStrictEqual(actual, expected);
  assertions += 1;
}

const base = { maxHp: 100, attack: 20, defense: 10, parry: 5 };
check(policy.scaleMonster(base, false), base);
// Non-camp entities without a dedicated final override retain the historical
// multiplier (the wave-six treasure chest uses this path).
check(policy.scaleMonster(base, true).maxHp, 150);
check(policy.scaleMonster(base, true).attack, 30);
check(policy.scaleMonster(base, true).defense, 15);
check(policy.scaleMonster(base, true).parry, 5);
const leveledWarrior = chapterPolicy.scaleMonster({ id: 'goblinWarrior' }, 'goblin-camp', 10);
const dungeonWarrior = policy.scaleMonster(leveledWarrior, true);
check(dungeonWarrior.maxHp, 90);
check(dungeonWarrior.attack, 12);
check(dungeonWarrior.defense, 6);
check(dungeonWarrior.xp, leveledWarrior.xp);
check(dungeonWarrior.parry, leveledWarrior.parry);
const preservedCaptain = policy.scaleMonster({
  id: 'goblinCaptain', level: 12, maxHp: 1, attack: 1, defense: 1,
  attackSpeed: .8, evasion: 4, parry: 25, damageReduction: 18, skillMarker: 'shield'
}, true);
check([preservedCaptain.attackSpeed, preservedCaptain.evasion, preservedCaptain.parry, preservedCaptain.damageReduction, preservedCaptain.skillMarker], [.8, 4, 25, 18, 'shield']);

const expectedFinalStats = {
  goblinScout: { 8: [48, 9, 2], 9: [52, 9, 2] },
  goblinWarrior: { 8: [80, 11, 6], 9: [85, 12, 6], 10: [90, 12, 6] },
  goblinSlinger: { 9: [60, 13, 3], 10: [64, 13, 3] },
  goblinGuard: { 11: [300, 18, 16] },
  goblinCaptain: { 12: [950, 24, 20] },
  goblinShaman: { 11: [220, 18, 8] },
  goblinHighChief: { 12: [1050, 20, 18] }
};

for (const [id, levels] of Object.entries(expectedFinalStats)) {
  for (const [level, expected] of Object.entries(levels)) {
    const leveled = chapterPolicy.scaleMonster({ id }, 'goblin-camp', Number(level));
    const scaled = policy.scaleMonster(leveled, true);
    check([scaled.maxHp, scaled.attack, scaled.defense], expected);
    check(scaled.xp, leveled.xp);
    check(scaled.gold, leveled.gold);
    check(scaled.evasion, leveled.evasion);
    check(scaled.parry, leveled.parry);
    check(scaled.damageReduction, leveled.damageReduction);
  }
}
check(policy.shouldStun('goblinSlinger', .19), true);
check(policy.shouldStun('goblinSlinger', .20), false);
check(policy.shouldStun('goblinWarrior', 0), false);
check(policy.SHAMAN_HEAL_RATIO, .15);
check(policy.SHAMAN_HEAL_CHANCE, .20);
check(policy.SHAMAN_HEAL_COOLDOWN_MS, 10000);
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .19, hasWoundedAlly: true }), 'heal');
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .20, hasWoundedAlly: true }), 'attack');
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .1, hasWoundedAlly: true, canHeal: false }), 'attack');
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .1, hasWoundedAlly: false }), 'attack');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .24, hasWoundedAlly: true, canSummon: true }), 'healing-totem');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .30, hasWoundedAlly: true, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .10, hasWoundedAlly: false, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .50, hasWoundedAlly: true, canSummon: true }), 'attack');

console.log(`goblin-camp-policy: ${assertions} assertions passed`);
