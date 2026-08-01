const assert = require('assert');
const policy = require('../boar-woods-policy');

let assertions = 0;
function check(actual, expected) {
  assert.deepStrictEqual(actual, expected);
  assertions += 1;
}

const piglet = { id: 'boarPiglet', damageReduction: 2 };
const protectedPiglet = policy.applyBoarWoodsPassive(piglet, 'boar-woods');
check(policy.THICK_HIDE_DAMAGE_REDUCTION_BONUS, 5);
check(protectedPiglet.damageReduction, 7);
check(protectedPiglet.passiveDamageReduction, true);
check(policy.applyBoarWoodsPassive(piglet, 'wolf-den'), piglet);
check(policy.applyBoarWoodsPassive({ id: 'lostGoblin', damageReduction: 2 }, 'boar-woods').passiveDamageReduction, undefined);
check(policy.applyBoarWoodsPassive({ id: 'boarKing', damageReduction: 94 }, 'boar-woods').damageReduction, 95);

check(policy.isIrritableActive('irritableBoar', 39, 100), true);
check(policy.isIrritableActive('irritableBoar', 40, 100), false);
check(policy.isIrritableActive('boarKing', 1, 100), true);
check(policy.isIrritableActive('forestBoar', 1, 100), false);
check(policy.getIrritableMultiplier('irritableBoar', 39, 100), 1.15);
check(policy.getIrritableMultiplier('boarKing', 40, 100), 1);

check(policy.shouldCharge('boarKing', .29), true);
check(policy.shouldCharge('boarKing', .30), false);
check(policy.shouldCharge('irritableBoar', 0), false);
check(policy.BOSS_CHARGE_STUN_MS, 2000);

console.log(`boar-woods-policy: ${assertions} assertions passed`);
