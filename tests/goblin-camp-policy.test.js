const assert = require('assert');
const policy = require('../goblin-camp-policy');

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
check(policy.shouldStun('goblinSlinger', .19), true);
check(policy.shouldStun('goblinSlinger', .20), false);
check(policy.shouldStun('goblinWarrior', 0), false);
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .34, hasWoundedAlly: true }), 'heal');
check(policy.resolveAction({ type: 'goblinShaman', randomValue: .1, hasWoundedAlly: false }), 'attack');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .24, hasWoundedAlly: true, canSummon: true }), 'healing-totem');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .30, hasWoundedAlly: true, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .10, hasWoundedAlly: false, canSummon: true }), 'summon-scout');
check(policy.resolveAction({ type: 'goblinHighChief', randomValue: .50, hasWoundedAlly: true, canSummon: true }), 'attack');

console.log(`goblin-camp-policy: ${assertions} assertions passed`);
