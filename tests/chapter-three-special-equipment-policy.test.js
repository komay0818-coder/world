const assert = require('node:assert/strict');
const policy = require('../chapter-three-special-equipment-policy.js');
const materialPolicy = require('../chapter-three-material-drop-policy.js');
const equipmentPolicy = require('../equipment-policy.js');
const runePolicy = require('../rune-policy.js');

assert.equal(policy.BOSS_DROP_RATE, .03);
assert.equal(policy.ELITE_DROP_RATE, .015);
const sources = [
  ['skullcrusher-vanguard-commander', 'bloodwar-wastes', 'vanguard-stonebreaker-armor', .03, { defense: 45, hp: 90, parry: .05 }, 'stonebreaker_bulwark'],
  ['skullcrusher-great-chieftain', 'skullcrusher-war-camp', 'great-chieftain-warscar-legguards', .03, { defense: 33, hp: 70, hpRegeneration: 4 }, 'warscar_counter'],
  ['skullcrusher-champion', 'skullcrusher-war-camp', 'skullcrusher-champion-warbracers', .015, { defense: 16, hp: 30, attackSpeedBonus: .05 }, 'hunting_frenzy'],
  ['awakened-guard', 'ancient-altar', 'awakened-runemark-hunting-garb', .015, { defense: 35, hp: 62, dodge: .05 }, 'runemark_afterimage'],
  ['temple-guardian', 'redrock-temple', 'temple-rune-robe', .015, { defense: 26, hp: 50, mana: 65 }, 'mana_surge']
];

sources.forEach(([monsterId, mapId, templateId, dropRate, baseStats, abilityId], index) => {
  const success = { inventory: [] };
  const item = policy.grantSpecialDrop(success, { id: monsterId }, mapId, { random: () => 0, obtainedAt: 1, uniqueIdFactory: () => `unique-${index}` });
  assert.equal(item.templateId, templateId);
  assert.equal(item.quality, 'epic');
  assert.deepEqual(item.baseStats, baseStats);
  Object.entries(baseStats).forEach(([stat, value]) => assert.equal(item[stat], value));
  assert.equal(item.fixedAffixes.length, 2);
  assert.equal(item.randomAffixes.length, 2);
  assert.equal(item.affixes.length, 4);
  assert.equal(item.specialAbility.id, abilityId);
  assert.equal(item.baseStatsStatus, 'ready');
  assert.equal(item.specialAbilityStatus, 'ready');
  assert.ok(['heavy', 'leather', 'cloth'].includes(item.armorType));
  assert.equal(runePolicy.getMaxSockets(item), 2);
  assert.ok(item.sockets >= 0 && item.sockets <= 2);
  assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: monsterId }, mapId, { random: () => dropRate }), null, 'drop-rate upper boundary is exclusive');
  assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: monsterId }, 'wrong-map', { random: () => 0 }), null);
  sources.filter(([otherId]) => otherId !== monsterId).forEach(([otherId, , otherTemplateId]) => assert.notEqual(item.templateId, otherTemplateId, `${monsterId} cannot drop ${otherId}'s item`));
});

assert.deepEqual(policy.TEMPLATES.vanguardStonebreakerArmor.fixedAffixIds, ['max_hp_percent', 'defense_percent']);
assert.deepEqual(policy.TEMPLATES.greatChieftainWarscarLegguards.fixedAffixIds, ['max_hp_percent', 'hp_regeneration_flat']);
assert.deepEqual(policy.TEMPLATES.templeRuneRobe.fixedAffixIds, ['skill_damage_percent', 'cooldown_speed_percent']);
assert.deepEqual(policy.TEMPLATES.skullcrusherChampionWarbracers.fixedAffixDefinitions.map((entry) => [entry.stat, entry.min]), [['attackSpeedPercent', 10], ['criticalChance', 7]]);
assert.deepEqual(policy.TEMPLATES.awakenedRunemarkHuntingGarb.fixedAffixDefinitions.map((entry) => [entry.stat, entry.min]), [['dodgePercent', 10], ['attackSpeedPercent', 10]]);

assert.deepEqual(policy.TEMPLATES.vanguardStonebreakerArmor.allowedJobs, ['warrior']);
assert.deepEqual(policy.TEMPLATES.skullcrusherChampionWarbracers.allowedJobs, ['hunter', 'assassin']);
assert.deepEqual(policy.TEMPLATES.templeRuneRobe.allowedJobs, ['mage', 'priest']);
assert.deepEqual(equipmentPolicy.getEquipSlots(policy.TEMPLATES.vanguardStonebreakerArmor, 'warrior'), ['armor']);
assert.deepEqual(equipmentPolicy.getEquipSlots(policy.TEMPLATES.vanguardStonebreakerArmor, 'mage'), []);

const repeated = { inventory: [] };
const first = policy.grantSpecialDrop(repeated, { id: 'skullcrusher-champion' }, 'skullcrusher-war-camp', { random: () => 0, obtainedAt: 1, uniqueIdFactory: () => 'same' });
const second = policy.grantSpecialDrop(repeated, { id: 'skullcrusher-champion' }, 'skullcrusher-war-camp', { random: () => 0, obtainedAt: 1, uniqueIdFactory: () => 'same' });
assert.equal(repeated.inventory.length, 2);
assert.notEqual(first.instanceId, second.instanceId, 'repeat drops always receive independent instance ids');

const legacy = { ...first, baseStats: {}, defense: 0, hp: 0, fixedAffixes: [], randomAffixes: [], affixes: [], specialAbility: null, sockets: 2, socketAttempts: 3 };
const upgraded = policy.upgradeSpecialEquipmentInstance(legacy);
assert.deepEqual(upgraded.baseStats, { defense: 16, hp: 30, attackSpeedBonus: .05 });
assert.equal(upgraded.instanceId, legacy.instanceId);
assert.equal(upgraded.fixedAffixes.length, 2);
assert.equal(upgraded.randomAffixes.length, 2);
assert.equal(upgraded.specialAbility.id, 'hunting_frenzy');
assert.equal(upgraded.sockets, 2);
assert.equal(upgraded.socketAttempts, 3);

const coexist = { inventory: [] };
materialPolicy.grantMaterialDrops(coexist, 'skullcrusher-war-camp', { id: 'skullcrusher-great-chieftain' }, { random: () => 0 });
policy.grantSpecialDrop(coexist, { id: 'skullcrusher-great-chieftain' }, 'skullcrusher-war-camp', { random: () => 0, uniqueIdFactory: () => 'coexist' });
assert.ok(coexist.inventory.some((item) => item.kind === 'material'));
assert.ok(coexist.inventory.some((item) => item.kind === 'equipment'));
console.log('chapter-three-special-equipment-policy: assertions passed');
