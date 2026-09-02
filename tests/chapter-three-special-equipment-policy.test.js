const assert = require('node:assert/strict');
const policy = require('../chapter-three-special-equipment-policy.js');
const materialPolicy = require('../chapter-three-material-drop-policy.js');
const equipmentPolicy = require('../equipment-policy.js');
const runePolicy = require('../rune-policy.js');

assert.equal(policy.BOSS_DROP_RATE, .03);
assert.equal(policy.ELITE_DROP_RATE, .015);
const sources = [
  ['skullcrusher-vanguard-commander', 'bloodwar-wastes', 'vanguard-stonebreaker-armor', .03],
  ['skullcrusher-great-chieftain', 'skullcrusher-war-camp', 'great-chieftain-warscar-legguards', .03],
  ['skullcrusher-champion', 'skullcrusher-war-camp', 'skullcrusher-champion-warbracers', .015],
  ['awakened-guard', 'ancient-altar', 'awakened-runemark-hunting-garb', .015],
  ['temple-guardian', 'redrock-temple', 'temple-rune-robe', .015]
];

sources.forEach(([monsterId, mapId, templateId, dropRate], index) => {
  const success = { inventory: [] };
  const item = policy.grantSpecialDrop(success, { id: monsterId }, mapId, { random: () => 0, obtainedAt: 1, uniqueIdFactory: () => `unique-${index}` });
  assert.equal(item.templateId, templateId);
  assert.equal(item.quality, 'epic');
  assert.deepEqual(item.baseStats, {});
  assert.deepEqual(item.fixedAffixes, []);
  assert.deepEqual(item.randomAffixes, []);
  assert.equal(item.specialAbility, null);
  assert.equal(item.specialAbilityDefinition.value, null);
  assert.equal(item.specialAbilityDefinition.duration, null);
  assert.ok(['heavy', 'leather', 'cloth'].includes(item.armorType));
  assert.equal(runePolicy.getMaxSockets(item), 2);
  assert.ok(item.sockets >= 0 && item.sockets <= 2);
  assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: monsterId }, mapId, { random: () => dropRate }), null, 'drop-rate upper boundary is exclusive');
  assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: monsterId }, 'wrong-map', { random: () => 0 }), null);
  sources.filter(([otherId]) => otherId !== monsterId).forEach(([otherId, , otherTemplateId]) => assert.notEqual(item.templateId, otherTemplateId, `${monsterId} cannot drop ${otherId}'s item`));
});

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

const coexist = { inventory: [] };
materialPolicy.grantMaterialDrops(coexist, 'skullcrusher-war-camp', { id: 'skullcrusher-great-chieftain' }, { random: () => 0 });
policy.grantSpecialDrop(coexist, { id: 'skullcrusher-great-chieftain' }, 'skullcrusher-war-camp', { random: () => 0, uniqueIdFactory: () => 'coexist' });
assert.ok(coexist.inventory.some((item) => item.kind === 'material'));
assert.ok(coexist.inventory.some((item) => item.kind === 'equipment'));
console.log('chapter-three-special-equipment-policy: assertions passed');
