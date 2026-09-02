const assert = require('node:assert/strict');
const conditional = require('../conditional-damage-policy.js');
const penetration = require('../armor-penetration-policy.js');
const affixes = require('../equipment-affix-policy.js');
const defense = require('../monster-defense.js');

const multiplier = (ratio, options = {}) => conditional.getDamageMultiplier({ currentHp: ratio * 10000, maxHp: 10000, attackKind: 'basic', ...options });
assert.equal(multiplier(.29, { lowHealthDamagePercent: .12 }), 1.12);
assert.equal(multiplier(.30, { lowHealthDamagePercent: .12 }), 1);
assert.equal(multiplier(.81, { highHealthDamagePercent: .08 }), 1.08);
assert.equal(multiplier(.80, { highHealthDamagePercent: .08 }), 1);
assert.equal(multiplier(.2999, { lowHealthDamagePercent: .12 }), 1.12);
assert.equal(multiplier(.8001, { highHealthDamagePercent: .08 }), 1.08);
['basic', 'skill', 'counter'].forEach((attackKind) => assert.equal(conditional.getDamageMultiplier({ currentHp: 29, maxHp: 100, lowHealthDamagePercent: .12, attackKind }), 1.12));
['companion', 'beast-slam', 'bleed-trigger', 'periodic', 'offhand'].forEach((attackKind) => assert.equal(conditional.getDamageMultiplier({ currentHp: 29, maxHp: 100, lowHealthDamagePercent: .12, attackKind }), 1, `${attackKind} is excluded`));
assert.equal(multiplier(.29, { lowHealthDamagePercent: .24 }), 1.24, 'multiple last-stand affixes add');
assert.equal(multiplier(.81, { highHealthDamagePercent: .16 }), 1.16, 'multiple first-strike affixes add');
assert.equal(multiplier(.50, { lowHealthDamagePercent: .12, highHealthDamagePercent: .08 }), 1, 'both affixes can be equipped but only a satisfied condition applies');

const lastStand = affixes.normalizeAffix({ id: 'last_stand_damage_percent' }, 'random', 3);
const firstStrike = affixes.normalizeAffix({ id: 'first_strike_damage_percent' }, 'random', 3);
assert.deepEqual(affixes.getEquippedAffixStats({ weapon: { affixes: [lastStand] }, ring: { affixes: [lastStand, firstStrike] } }), { lowHealthDamagePercent: 24, highHealthDamagePercent: 8 });
const selectedLastStand = affixes.getAvailableAffixes({ id: 'weapon', kind: 'equipment', slot: 'weapon' }, [lastStand], { chapter: 3, quality: 'epic' }).map((entry) => entry.id);
assert.equal(selectedLastStand.includes('first_strike_damage_percent'), true, 'last stand and first strike are not mutually exclusive');

const criticalBase = 100 * 1.5;
assert.ok(Math.ceil(criticalBase * multiplier(.29, { lowHealthDamagePercent: .12 })) > criticalBase, 'critical damage and conditional damage coexist');
const ignoredDefense = penetration.getEffectiveDefense(100, { equipmentArmorPenetration: .08, attackKind: 'basic' });
const combined = defense.resolveDamage({ baseDamage: 100 * multiplier(.81, { highHealthDamagePercent: .08 }), monster: { defense: ignoredDefense }, canEvade: false, canParry: false }).finalDamage;
assert.equal(combined, 57, 'conditional damage and armor penetration coexist');
assert.equal(defense.resolveDamage({ baseDamage: 100 * multiplier(.50), monster: { defense: 100 }, canEvade: false, canParry: false }).finalDamage, 50, 'characters without a satisfied affix keep the original result');

console.log('conditional-damage-policy: assertions passed');
