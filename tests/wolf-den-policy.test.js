const assert = require('assert');
const policy = require('../wolf-den-policy');

let assertions = 0;
function check(actual, expected) {
  assert.deepStrictEqual(actual, expected);
  assertions += 1;
}

const wolf = { id: 'denForestWolf', evasion: 8 };
check(policy.applyWolfDenPassive(wolf, 'wolf-den').evasion, 18);
check(policy.applyWolfDenPassive(wolf, 'wolf-den').passiveEvasion, true);
check(policy.applyWolfDenPassive(wolf, 'boar-woods'), wolf);
check(policy.applyWolfDenPassive({ id: 'lostGoblin', evasion: 5 }, 'wolf-den').evasion, 5);
check(policy.shouldInflictBleed('greatfangWolf', .29), true);
check(policy.shouldInflictBleed('greatfangWolf', .30), false);
check(policy.shouldInflictBleed('ragingWolf', 0), false);
check(policy.getBloodFrenzyMultiplier('greatfangWolf', true), 1.2);
check(policy.getBloodFrenzyMultiplier('greatfangWolf', false), 1);
check(policy.getBloodFrenzyMultiplier('ragingWolf', true), 1);
check(policy.BLEED_DURATION_MS, 5000);
check(policy.BLEED_TICK_MS, 1000);

console.log(`wolf-den-policy: ${assertions} assertions passed`);
