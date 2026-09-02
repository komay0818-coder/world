const assert = require('node:assert/strict');
const policy = require('../equipment-affix-policy.js');

const value = (id, chapter) => policy.normalizeAffix({ id }, 'random', chapter).components.map((component) => component.value);
const simpleTiers = {
  attack_flat: [4, 6, 9], max_hp_flat: [20, 30, 45], hp_regeneration_flat: [3, 5, 7],
  max_hp_percent: [8, 12, 15], defense_percent: [8, 12, 15], accuracy_percent: [5, 8, 10],
  dodge_percent: [5, 8, 10], attack_speed_percent: [5, 8, 10], critical_chance: [3, 5, 7],
  mana_regeneration_percent: [10, 15, 20]
};
Object.entries(simpleTiers).forEach(([id, tiers]) => tiers.forEach((expected, index) => assert.deepEqual(value(id, index + 1), [expected], `${id} chapter ${index + 1}`)));

const advancedTiers = {
  skill_damage_percent: [8, 10], critical_damage_percent: [10, 15], cooldown_speed_percent: [8, 10],
  elite_damage_percent: [8, 10], boss_damage_percent: [8, 10], basic_attack_damage_percent: [8, 10],
  kill_health_recovery_percent: [3, 4], kill_resource_recovery_percent: [5, 7], mage_fireball_damage: [5, 7]
};
Object.entries(advancedTiers).forEach(([id, tiers]) => tiers.forEach((expected, index) => assert.deepEqual(value(id, index + 2), [expected], `${id} chapter ${index + 2}`)));
assert.deepEqual(value('chapter2_berserker', 2), [4, 5]);
assert.deepEqual(value('chapter2_berserker', 3), [6, 7]);

const armor = { id: 'armor', kind: 'equipment', slot: 'armor' };
const weapon = { id: 'weapon', kind: 'equipment', slot: 'weapon', allowedJobs: ['hunter'] };
const accessory = { id: 'ring', kind: 'equipment', slot: 'ring' };
const pool = (item, chapter, quality = 'rare') => policy.getAvailableAffixes(item, [], { chapter, quality }).map((entry) => entry.id);
assert.equal(pool(armor, 2).includes('poison_resistance_percent'), true);
assert.equal(pool(armor, 3).includes('poison_resistance_percent'), false);
assert.equal(policy.EQUIPMENT_AFFIXES.poison_resistance_percent.maxChapter, 2);

const skillEnhancement = policy.EQUIPMENT_AFFIXES.mage_fireball_damage;
assert.equal(skillEnhancement.id, 'mage_fireball_damage');
assert.equal(skillEnhancement.name, '技能強化');
assert.deepEqual(skillEnhancement.allowedGroups, ['weapon', 'accessory']);
assert.equal(skillEnhancement.jobId, null);
assert.equal(skillEnhancement.skillId, null);
assert.deepEqual(skillEnhancement.valuesByChapter, { 2: 5, 3: 7 });
assert.equal(pool(weapon, 2, 'uncommon').includes(skillEnhancement.id), true);
assert.equal(pool(accessory, 2, 'uncommon').includes(skillEnhancement.id), true);
const legacySkillEnhancement = { id: skillEnhancement.id, name: '火球傷害（格式範例）', value: 5, unit: '%', components: [{ stat: 'skillDamagePercent', value: 5, unit: '%' }] };
const legacySnapshot = JSON.stringify(legacySkillEnhancement);
assert.equal(policy.formatAffix(legacySkillEnhancement), '技能強化 +5%');
assert.equal(policy.getEquippedAffixStats({ weapon: { affixes: [legacySkillEnhancement] } }).skillDamagePercent, 5);
assert.equal(JSON.stringify(legacySkillEnhancement), legacySnapshot, 'display normalization does not mutate or reroll the saved affix');
assert.equal(policy.formatAffix(policy.normalizeAffix({ id: skillEnhancement.id }, 'random', 3)), '技能強化 +7%');
const afterSkillDamage = policy.getAvailableAffixes(weapon, [policy.normalizeAffix({ id: 'skill_damage_percent' }, 'random', 3)], { chapter: 3, quality: 'rare' }).map((entry) => entry.id);
assert.equal(afterSkillDamage.includes(skillEnhancement.id), false, 'same modifier remains mutually exclusive');

const reserved = policy.EQUIPMENT_AFFIXES.chapter3_berserker_master;
assert.equal(reserved.rollable, false);
assert.equal(reserved.combatStatus, 'reserved');
assert.deepEqual(reserved.components.map(({ stat, value, unit }) => ({ stat, value, unit })), [
  { stat: 'attackFlat', value: 4, unit: '' }, { stat: 'attackSpeedPercent', value: 5, unit: '%' }, { stat: 'criticalChance', value: 3, unit: '%' }
]);
assert.deepEqual(reserved.allowedGroups, ['weapon']);
assert.deepEqual(reserved.qualities, ['epic', 'legendary']);
assert.equal(pool(weapon, 3, 'epic').includes(reserved.id), false);

const armorPenetration = policy.EQUIPMENT_AFFIXES.armor_penetration_percent;
assert.equal(armorPenetration.rollable, true);
assert.equal(armorPenetration.combatStatus, 'ready');
assert.equal(pool(weapon, 1, 'epic').includes(armorPenetration.id), false);
assert.equal(pool(weapon, 2, 'epic').includes(armorPenetration.id), false);
assert.equal(pool(weapon, 3, 'epic').includes(armorPenetration.id), true);
assert.equal(pool(accessory, 3, 'epic').includes(armorPenetration.id), true);
assert.equal(pool(armor, 3, 'epic').includes(armorPenetration.id), false);
assert.deepEqual(value('armor_penetration_percent', 3), [8]);

const pendingIds = ['last_stand_damage_percent', 'first_strike_damage_percent', 'critical_resource_recovery_percent', 'control_resistance_percent', 'direct_hit_health_recovery_percent'];
pendingIds.forEach((id) => {
  const definition = policy.EQUIPMENT_AFFIXES[id];
  assert.ok(definition, `${id} definition exists`);
  assert.equal(definition.unlockChapter, 3);
  assert.equal(definition.rollable, false);
  assert.equal(definition.combatStatus, 'pending');
  [weapon, armor, accessory].forEach((item) => assert.equal(pool(item, 3, 'epic').includes(id), false, `${id} cannot be obtained yet`));
});
assert.deepEqual(value('last_stand_damage_percent', 3), [12]);
assert.deepEqual(value('first_strike_damage_percent', 3), [8]);
assert.deepEqual(value('critical_resource_recovery_percent', 3), [2]);
assert.deepEqual(value('control_resistance_percent', 3), [15]);
assert.deepEqual(value('direct_hit_health_recovery_percent', 3), [2]);
assert.deepEqual(policy.EQUIPMENT_AFFIXES.direct_hit_health_recovery_percent.trigger, { event: 'enemy-direct-hit', chance: .05 });
const formalExistingPool = Object.values(policy.EQUIPMENT_AFFIXES).filter((definition) => definition.enabled && definition.rollable && definition.unlockChapter <= 3 && (definition.maxChapter == null || definition.maxChapter >= 3));
assert.equal(formalExistingPool.length, 21, 'the formal pool contains twenty existing affixes plus armor penetration');

console.log('chapter-three-affix-data: assertions passed');
