const assert = require('assert');
const defense = require('../monster-defense.js');

function resolve(overrides = {}) {
  return defense.resolveDamage({
    baseDamage: 100,
    monster: {},
    damageType: 'physical',
    attackRange: 'ranged',
    random: () => 1,
    ...overrides
  });
}

assert.equal(resolve().finalDamage, 100, 'missing stats default to zero');
assert.equal(resolve({ monster: { evasion: 100 }, random: () => 0 }).finalDamage, 0, 'evasion prevents all damage');
assert.equal(resolve({ monster: { parry: 100 }, attackRange: 'melee', random: () => 0 }).finalDamage, 50, 'melee physical attacks can be parried');
assert.equal(resolve({ monster: { parry: 100 }, attackRange: 'ranged', random: () => 0 }).finalDamage, 100, 'ranged attacks cannot be parried');
assert.equal(resolve({ monster: { defense: 15 } }).finalDamage, 87, 'defense reduces physical damage');
assert.equal(resolve({ monster: { defense: 15 }, damageType: 'magic' }).finalDamage, 94, 'magic damage uses half of monster defense');
assert.equal(resolve({ monster: { defense: 15, damageReduction: 10 }, damageType: 'magic' }).finalDamage, 84, 'magic defense and damage reduction apply in order');
assert.equal(resolve({
  monster: { parry: 100, defense: 15, damageReduction: 10 },
  attackRange: 'melee',
  random: () => 0
}).finalDamage, 40, 'parry, defense, then damage reduction use the required order');
assert.equal(defense.PLAYER_DEFENSE_COEFFICIENT, 6, 'player defense uses the reduced coefficient');
assert.equal(defense.resolvePlayerDamage({ baseDamage: 100, defense: 15 }).finalDamage, 53, 'player defense reduces incoming damage with coefficient six');
assert.equal(defense.resolvePlayerDamage({ baseDamage: 100, defense: 15, damageReduction: .02 }).finalDamage, 52, 'player damage reduction applies after defense');

console.log('monster-defense: 11 assertions passed');
