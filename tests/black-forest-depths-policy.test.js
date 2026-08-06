const assert = require('node:assert/strict');
const policy = require('../black-forest-depths-policy.js');

assert.equal(policy.RULES.denseFogAccuracyPenalty, .15);
assert.equal(policy.RULES.denseFogUnavoidable, true);
assert.equal(policy.RULES.bossAuraModifiers, null);
assert.equal(policy.applyDenseFogAccuracy(1.05, 'black-forest-depths'), .90);
assert.equal(policy.applyDenseFogAccuracy(.10, 'black-forest-depths'), 0);
assert.equal(policy.applyDenseFogAccuracy(1.05, 'forest-altar'), 1.05);
const enemies = [{ id: 'boss', isBoss: true, currentHp: 100 }, { id: 'alive', currentHp: 10 }, { id: 'dead', currentHp: 0 }];
assert.deepEqual(policy.getBossAura(enemies), { active: true, affectedEnemyIds: ['alive'], modifiers: null });
enemies[0].currentHp = 0;
assert.deepEqual(policy.getBossAura(enemies), { active: false, affectedEnemyIds: [], modifiers: null });
console.log('black-forest-depths-policy: assertions passed');
