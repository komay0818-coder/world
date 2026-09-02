const assert = require('node:assert/strict');
const penetration = require('../armor-penetration-policy.js');
const affixes = require('../equipment-affix-policy.js');
const defense = require('../monster-defense.js');

assert.equal(penetration.ARMOR_IGNORE_CAP, .80);
assert.deepEqual(penetration.EQUIPMENT_ELIGIBLE_ATTACK_KINDS, ['basic', 'skill', 'counter']);
['basic', 'skill', 'counter'].forEach((kind) => assert.equal(penetration.getTotalArmorIgnore({ equipmentArmorPenetration: .08, attackKind: kind }), .08));
['companion', 'beast-slam', 'bleed-trigger', 'offhand', 'periodic'].forEach((kind) => assert.equal(penetration.getTotalArmorIgnore({ equipmentArmorPenetration: .08, attackKind: kind }), 0, `${kind} excludes equipment penetration`));
assert.equal(penetration.getTotalArmorIgnore({ skillArmorIgnore: .20, equipmentArmorPenetration: .08, attackKind: 'skill' }), .28, 'skill and equipment sources add');
assert.equal(penetration.getTotalArmorIgnore({ skillArmorIgnore: .50, equipmentArmorPenetration: .40, attackKind: 'skill' }), .80, 'all sources share the cap');
assert.equal(penetration.getEffectiveDefense(100, { equipmentArmorPenetration: .08, attackKind: 'basic' }), 92);
assert.ok(Math.abs(penetration.getEffectiveDefense(100, { skillArmorIgnore: 2, equipmentArmorPenetration: 2, attackKind: 'skill' }) - 20) < Number.EPSILON * 100, 'effective defense never becomes negative');

const penetrationAffix = affixes.normalizeAffix({ id: 'armor_penetration_percent' }, 'random', 3);
const weapon = { id: 'weapon', kind: 'equipment', slot: 'weapon', affixes: [penetrationAffix] };
const ring = { id: 'ring', kind: 'equipment', slot: 'ring', affixes: [penetrationAffix] };
const necklace = { id: 'necklace', kind: 'equipment', slot: 'necklace', affixes: [penetrationAffix] };
assert.equal(affixes.getEquippedAffixStats({ weapon }).armorPenetrationPercent, 8);
assert.equal(affixes.getEquippedAffixStats({}).armorPenetrationPercent, undefined, 'unequipping removes the stat');
assert.equal(affixes.getEquippedAffixStats({ weapon, ring, necklace }).armorPenetrationPercent, 24, 'multiple equipment pieces add');

const baseDamage = defense.resolveDamage({ baseDamage: 100, monster: { defense: 100 }, canEvade: false, canParry: false }).finalDamage;
const penetratedDamage = defense.resolveDamage({ baseDamage: 100, monster: { defense: penetration.getEffectiveDefense(100, { equipmentArmorPenetration: .08, attackKind: 'basic' }) }, canEvade: false, canParry: false }).finalDamage;
assert.equal(baseDamage, 50, 'the existing no-penetration result stays unchanged');
assert.equal(penetratedDamage, 53, 'penetration changes enemy defense rather than multiplying final damage');

console.log('armor-penetration-policy: assertions passed');
