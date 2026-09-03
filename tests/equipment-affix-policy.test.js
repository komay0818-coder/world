const assert = require('node:assert/strict');
const policy = require('../equipment-affix-policy.js');

const weapon = { id: 'test-sword', kind: 'equipment', slot: 'weapon', name: '測試劍' };
const armor = { id: 'test-armor', kind: 'equipment', slot: 'armor', name: '測試甲' };
const accessory = { id: 'test-ring', kind: 'equipment', slot: 'ring1', name: '測試戒指' };
assert.equal(policy.SCHEMA_VERSION, 4);
assert.equal(policy.getEquipmentGroup(weapon), 'weapon');
assert.equal(policy.getEquipmentGroup(armor), 'armor');
assert.equal(policy.getEquipmentGroup(accessory), 'accessory');
assert.deepEqual(policy.QUALITY_AFFIX_RULES.uncommon, { fixedCount: 1, randomCount: 2, specialChance: 0 });
assert.deepEqual(policy.QUALITY_AFFIX_RULES.rare, { fixedCount: 2, randomCount: 3, specialChance: 0 });
assert.deepEqual(policy.QUALITY_AFFIX_RULES.epic, { fixedCount: 2, randomCount: 4, specialChance: .15 });
assert.equal(policy.QUALITY_AFFIX_RULES.legendary.requiresLegendaryAbility, true);
assert.ok(policy.MUTUAL_EXCLUSIONS.some((pair) => pair.includes('attack_flat') && pair.includes('skill_damage_percent')));

const common = policy.createEquipmentInstance(armor, { quality: 'common', uniqueId: 'common' });
assert.deepEqual(common.affixes, []);
const green = policy.createEquipmentInstance(armor, { quality: 'uncommon', uniqueId: 'green', random: () => .25 });
assert.equal(green.fixedAffixes.length, 1);
assert.equal(green.randomAffixes.length, 2);
assert.equal(green.affixes.length, 3);
const blue = policy.createEquipmentInstance(armor, { quality: 'rare', uniqueId: 'blue', random: () => .4 });
assert.equal(blue.fixedAffixes.length, 2);
assert.equal(blue.randomAffixes.length, 3);
const purple = policy.createEquipmentInstance(weapon, { quality: 'epic', uniqueId: 'purple', random: () => .5 });
assert.equal(purple.fixedAffixes.length, 2);
assert.equal(purple.randomAffixes.length, 4);
assert.equal(new Set(purple.affixes.map((entry) => entry.stat)).size, 6, 'V3 never duplicates a stat');
assert.equal(purple.affixes.some((entry) => entry.id === 'attack_flat') && purple.affixes.some((entry) => entry.id === 'skill_damage_percent'), false, 'configured mutually exclusive affixes never coexist');

const configured = { ...armor, fixedAffixIds: ['max_hp_percent'], specialAbilityIds: ['cooldown_reset_on_critical'] };
const disabledSpecial = policy.createEquipmentInstance(configured, { quality: 'epic', uniqueId: 'special', specialChance: 1, random: () => 0 });
assert.equal(disabledSpecial.specialAbility, null, 'special definitions remain data-gated until enabled');
const legendary = policy.createEquipmentInstance({ ...weapon, legendaryAbility: { id: 'burn', name: '黑炎', description: '命中附加燃燒。' } }, { quality: 'legendary', uniqueId: 'legendary', random: () => 0 });
assert.equal(legendary.legendaryAbility.id, 'burn');
assert.ok(legendary.fixedAffixes.length >= 2 && legendary.fixedAffixes.length <= 3);
assert.ok(legendary.randomAffixes.length >= 1 && legendary.randomAffixes.length <= 2);

purple.affixes.forEach((entry) => assert.equal(entry.value, policy.EQUIPMENT_AFFIXES[entry.id].value, 'rolled values always equal the definition'));
const tampered = JSON.parse(JSON.stringify(green));
tampered.affixes.forEach((entry) => { entry.value = 999; });
tampered.fixedAffixes.forEach((entry) => { entry.value = 999; });
tampered.randomAffixes.forEach((entry) => { entry.value = 999; });
const normalized = policy.normalizeEquipment(tampered);
normalized.affixes.forEach((entry) => assert.equal(entry.value, policy.EQUIPMENT_AFFIXES[entry.id].value, 'loading repairs floating/tampered values'));
assert.deepEqual(policy.normalizeEquipment(JSON.parse(JSON.stringify(green))), green, 'V3 save/load is stable');

const legacy = policy.normalizeEquipment({ ...armor, quality: 'uncommon', affixes: [{ id: 'max_hp_percent', value: 7 }] });
assert.equal(legacy.affixSchemaVersion, undefined, 'legacy saves remain readable without being silently rerolled');
assert.equal(legacy.affixes[0].value, policy.EQUIPMENT_AFFIXES.max_hp_percent.value);
assert.deepEqual(policy.normalizeEquipment({ ...armor, quality: undefined }).affixes, []);

const worn = policy.getEquippedAffixStats({ armor: green });
assert.ok(Object.keys(worn).length > 0);
assert.deepEqual(policy.getEquippedAffixStats({}), {});
assert.match(policy.formatAffix(green.affixes[0]), /\+/);
const chapterTwoHp = policy.createEquipmentInstance({ ...armor, fixedAffixIds: ['max_hp_percent'] }, { quality: 'uncommon', chapter: 2, random: () => 0 }).fixedAffixes[0];
assert.equal(chapterTwoHp.value, 12);
assert.equal(policy.formatAffix(chapterTwoHp), '最大生命 +12%', 'UI formats the chapter-tier value stored on the equipment instance');
assert.equal(policy.formatAffix({ ...chapterTwoHp, value: 17, components: [{ stat: 'maxHpPercent', value: 17, unit: '%' }] }), '最大生命 +17%', 'UI never replaces an instance value with the chapter-one definition');
assert.equal(policy.formatAffix({ id: 'max_hp_percent', value: 12, unit: '%' }), '最大生命 +12%', 'legacy single-stat entries also display their stored value');

const killHealAffix = policy.normalizeAffix({ id: 'kill_health_recovery_percent' }, 'random', 2);
assert.equal(killHealAffix.value, 2, 'each kill-health recovery affix restores 2% maximum health');
const killHealStats = count => policy.getEquippedAffixStats(Object.fromEntries(Array.from({ length: count }, (_, index) => [`armor${index}`, { affixes: [killHealAffix] }])));
assert.equal(killHealStats(1).killHealthRecoveryPercent, 2, 'one kill-health recovery affix grants 2%');
assert.equal(killHealStats(2).killHealthRecoveryPercent, 4, 'two kill-health recovery affixes stack to 4%');
assert.equal(killHealStats(3).killHealthRecoveryPercent, 6, 'three kill-health recovery affixes stack to 6% without a cap or diminishing returns');

const chapterTwoAvailable = policy.getAvailableAffixes(weapon, [], { chapter: 2, quality: 'rare' }).map((entry) => entry.id);
['elite_damage_percent', 'boss_damage_percent', 'skill_damage_percent', 'basic_attack_damage_percent', 'kill_resource_recovery_percent'].forEach((id) => assert.ok(chapterTwoAvailable.includes(id), `chapter two unlocks ${id}`));
assert.ok(chapterTwoAvailable.includes('critical_damage_percent'), 'chapter two unlocks critical damage');
assert.equal(policy.getAvailableAffixes(weapon, [], { chapter: 1, quality: 'rare' }).some((entry) => entry.id === 'critical_damage_percent'), false, 'critical damage stays locked in chapter one');
assert.equal(policy.getAvailableAffixes(weapon, [], { chapter: 1, quality: 'rare' }).some((entry) => entry.unlockChapter > 1), false, 'chapter one cannot roll chapter-two affixes');
const chapterOneTier = policy.createEquipmentInstance({ ...weapon, fixedAffixIds: ['attack_flat'] }, { quality: 'uncommon', chapter: 1, random: () => 0 });
const chapterTwoTier = policy.createEquipmentInstance({ ...weapon, fixedAffixIds: ['attack_flat'] }, { quality: 'uncommon', chapter: 2, random: () => 0 });
assert.equal(chapterTwoTier.fixedAffixes[0].value, Math.round(chapterOneTier.fixedAffixes[0].value * 1.5), 'chapter-two general affixes use tier-two values');
console.log('equipment-affix-policy: assertions passed');
