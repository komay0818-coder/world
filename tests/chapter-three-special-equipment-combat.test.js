const assert = require('node:assert/strict');
const policy = require('../chapter-three-special-equipment-policy.js');

const item = (id) => ({ specialAbility: { id } });
const member = (id, extra = {}) => ({ alive: true, maxHp: 1000, resourceCurrent: 20, resourceMax: 100, progress: { equipment: { armor: item(id) } }, ...extra });

const bulwark = member(policy.ABILITIES.bulwark);
assert.equal(policy.resolveEnemyAttackOutcome(bulwark, { actualDamage: 149 }, 1000).bulwarkTriggered, false);
assert.equal(policy.resolveEnemyAttackOutcome(bulwark, { actualDamage: 150 }, 1000).bulwarkTriggered, true);
assert.equal(policy.getDefenseMultiplier(bulwark, 6999), 1.25);
assert.equal(policy.getDefenseMultiplier(bulwark, 7000), 1);
assert.equal(policy.resolveEnemyAttackOutcome(bulwark, { actualDamage: 200 }, 11999).bulwarkTriggered, false, 'twelve-second cooldown blocks retrigger');
assert.equal(policy.resolveEnemyAttackOutcome(bulwark, { actualDamage: 200 }, 13000).bulwarkTriggered, true);
assert.equal(policy.resolveEnemyAttackOutcome(bulwark, { actualDamage: 0 }, 26000).bulwarkTriggered, false);

const counter = member(policy.ABILITIES.counter);
policy.resolveEnemyAttackOutcome(counter, { parried: true }, 1);
let basic = policy.beginMainHandBasicAttack(counter, 'a');
assert.equal(basic.damageMultiplier, 1.30);
policy.completeMainHandBasicAttack(counter, basic, false);
assert.equal(counter.warscarCounterPending, true, 'a missed basic does not consume the pending strike');
policy.completeMainHandBasicAttack(counter, basic, true);
assert.equal(counter.warscarCounterPending, false);
policy.resolveEnemyAttackOutcome(counter, { parried: true }, 2);
policy.resolveEnemyAttackOutcome(counter, { parried: true }, 3);
assert.equal(policy.beginMainHandBasicAttack(counter, 'a').damageMultiplier, 1.30, 'consecutive blocks do not stack');

const frenzy = member(policy.ABILITIES.frenzy);
basic = policy.beginMainHandBasicAttack(frenzy, 'target-a');
assert.equal(basic.damageMultiplier, 1, 'first hit does not benefit from its future stack');
policy.completeMainHandBasicAttack(frenzy, basic, true);
assert.equal(policy.beginMainHandBasicAttack(frenzy, 'target-a').damageMultiplier, 1.04);
for (let i = 0; i < 8; i += 1) policy.completeMainHandBasicAttack(frenzy, policy.beginMainHandBasicAttack(frenzy, 'target-a'), true);
assert.equal(policy.beginMainHandBasicAttack(frenzy, 'target-a').damageMultiplier, 1.20);
assert.equal(policy.beginMainHandBasicAttack(frenzy, 'target-b').damageMultiplier, 1, 'changing targets clears all stacks');

const afterimage = member(policy.ABILITIES.afterimage);
policy.resolveEnemyAttackOutcome(afterimage, { dodged: true }, 1);
basic = policy.beginMainHandBasicAttack(afterimage, 'target');
assert.equal(basic.guaranteedCritical, true);
policy.completeMainHandBasicAttack(afterimage, basic, false);
assert.equal(afterimage.runemarkGuaranteedCrit, true);
policy.completeMainHandBasicAttack(afterimage, basic, true);
assert.equal(afterimage.runemarkGuaranteedCrit, false);

const surge = member(policy.ABILITIES.manaSurge, { resourceCurrent: 60, resourceMax: 100 });
assert.deepEqual(policy.resolveManaSurge(surge, 40, () => .25), { triggered: false, restored: 0 });
assert.deepEqual(policy.resolveManaSurge(surge, 40, () => .249999), { triggered: true, requested: 20, restored: 20 });
surge.resourceCurrent = 99;
assert.equal(policy.resolveManaSurge(surge, 3, () => 0).restored, 1, 'refund uses ceil rounding and respects the resource cap');
assert.equal(policy.resolveManaSurge(surge, 0, () => 0).triggered, false);

policy.clearCombatState(frenzy);
assert.equal(frenzy.huntingFrenzyStacks, 0);
assert.equal(frenzy.huntingFrenzyTarget, null);
console.log('chapter-three-special-equipment-combat: assertions passed');
