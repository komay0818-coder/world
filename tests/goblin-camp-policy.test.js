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
check(policy.scaleMonster(base, true).maxHp, 150);
check(policy.scaleMonster(base, true).attack, 30);
check(policy.scaleMonster(base, true).defense, 15);
check(policy.scaleMonster(base, true).parry, 5);
const leveledWarrior = chapterPolicy.scaleMonster({ id: 'goblinWarrior' }, 'goblin-camp', 10);
const dungeonWarrior = policy.scaleMonster(leveledWarrior, true);
check(dungeonWarrior.maxHp, Math.round(leveledWarrior.maxHp * 1.5));
check(dungeonWarrior.attack, Math.round(leveledWarrior.attack * 1.5));
check(dungeonWarrior.defense, Math.round(leveledWarrior.defense * 1.5));
check(dungeonWarrior.xp, leveledWarrior.xp);
check(policy.shouldStun('goblinSlinger', .19), true);
check(policy.shouldStun('goblinSlinger', .20), false);
check(policy.shouldStun('goblinWarrior', 0), false);
check(policy.SHAMAN_HEAL_RATIO, .15);
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .34, hasWoundedAlly: true }), 'heal');
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .1, hasWoundedAlly: false }), 'attack');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .24, hasWoundedAlly: true, canSummon: true }), 'healing-totem');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .30, hasWoundedAlly: true, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .10, hasWoundedAlly: false, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .50, hasWoundedAlly: true, canSummon: true }), 'attack');

console.log(`goblin-camp-policy: ${assertions} assertions passed`);
