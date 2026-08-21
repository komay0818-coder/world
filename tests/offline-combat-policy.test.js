const assert = require('node:assert/strict');
const policy = require('../offline-combat-policy.js');

const player = { maxHp: 100, currentHp: 100, attack: 25, defense: 0, damageReduction: 0, attackSpeed: 1, damageType: 'physical', attackRange: 'melee' };
const monster = { maxHp: 50, attack: 10, defense: 0, damageReduction: 0, attackSpeed: 1 };

const survived = policy.simulate({ durationMs: 5000, player, monsters: [monster] });
assert.deepEqual(survived, { died: false, defeated: 2, effectiveMs: 5000, deathAtMs: null, remainingHp: 50 }, 'simulation settles complete encounters and partial incoming damage');

const defeated = policy.simulate({ durationMs: 20000, player, monsters: [monster] });
assert.equal(defeated.died, true);
assert.equal(defeated.defeated, 4, 'the lethal unfinished encounter grants no kill');
assert.equal(defeated.deathAtMs, 10000, 'death time truncates the offline duration');
assert.equal(defeated.effectiveMs, 10000);

const fastPlayer = policy.simulate({ durationMs: 10000, player: { ...player, attack: 100, attackSpeed: 2 }, monsters: [monster] });
assert.equal(fastPlayer.defeated, 20, 'simulation advances by encounters rather than one-second ticks');
assert.equal(fastPlayer.remainingHp, 100, 'monsters killed before their first attack deal no damage');

assert.deepEqual(policy.simulate({ durationMs: 1000, player: { ...player, currentHp: 0 }, monsters: [monster] }), { died: true, defeated: 0, effectiveMs: 0, deathAtMs: 0, remainingHp: 0 });
