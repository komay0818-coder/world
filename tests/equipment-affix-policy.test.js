const assert = require('assert');
const policy = require('../equipment-affix-policy.js');

const weapon = { id: 'test-sword', kind: 'equipment', slot: 'weapon', name: '測試劍' };
const armor = { id: 'test-armor', kind: 'equipment', slot: 'armor', name: '測試甲' };
const accessory = { id: 'test-ring', kind: 'equipment', slot: 'ring1', name: '測試戒指' };
const offhand = { id: 'test-shield', kind: 'equipment', slot: 'offhand', name: '測試盾' };

assert.equal(policy.getEquipmentGroup(weapon), 'weapon');
assert.equal(policy.getEquipmentGroup(armor), 'armor');
assert.equal(policy.getEquipmentGroup(accessory), 'accessory');
assert.equal(policy.getEquipmentGroup(offhand), null, 'special offhands retain their existing dedicated rules');

const enabled = Object.values(policy.EQUIPMENT_AFFIXES).filter((entry) => entry.enabled);
const disabled = Object.values(policy.EQUIPMENT_AFFIXES).filter((entry) => !entry.enabled);
assert.ok(enabled.every((entry) => entry.disabledReason === ''));
assert.ok(disabled.every((entry) => entry.disabledReason), 'every inactive affix documents why it cannot roll');
assert.equal(policy.EQUIPMENT_AFFIXES.item_find_percent.enabled, false, 'an inert item-find affix cannot be displayed as effective');

const common = policy.createEquipmentInstance(armor, { quality: 'common', uniqueId: 'common' });
assert.equal(common.quality, 'common');
assert.deepEqual(common.affixes, [], 'white equipment has no affix');

const greenArmor = policy.createEquipmentInstance(armor, { quality: 'uncommon', randomValue: 0, uniqueId: 'green' });
assert.equal(greenArmor.quality, 'uncommon');
assert.equal(greenArmor.affixes.length, 1, 'green equipment has exactly one affix');
assert.ok(policy.EQUIPMENT_AFFIXES[greenArmor.affixes[0].id].allowedGroups.includes('armor'));

const greenWeapon = policy.createEquipmentInstance(weapon, { quality: 'uncommon', randomValue: .999, uniqueId: 'green' });
assert.equal(greenWeapon.affixes.length, 1);
assert.ok(policy.EQUIPMENT_AFFIXES[greenWeapon.affixes[0].id].allowedGroups.includes('weapon'));
assert.ok(!['max_hp_percent', 'defense_percent', 'dodge_percent'].includes(greenWeapon.affixes[0].id), 'weapons cannot roll armor-only affixes');

const armorCandidates = policy.getAvailableAffixes(armor).map((entry) => entry.id);
assert.deepEqual(armorCandidates.sort(), ['cooldown_speed_percent', 'defense_percent', 'dodge_percent', 'mana_regeneration_percent', 'max_hp_percent'].sort());
assert.ok(!armorCandidates.includes('strength_percent'), 'unimplemented primary attributes remain disabled instead of appearing inert');

const sameNameA = policy.createEquipmentInstance(weapon, { quality: 'uncommon', randomValue: 0, uniqueId: 'a' });
const sameNameB = policy.createEquipmentInstance(weapon, { quality: 'uncommon', randomValue: .999, uniqueId: 'b' });
assert.equal(sameNameA.name, sameNameB.name);
assert.notEqual(sameNameA.affixes[0].id, sameNameB.affixes[0].id, 'same-name drops can keep distinct permanent affixes');

const rerenderSnapshot = JSON.stringify(greenArmor.affixes);
policy.getQualityLabel(greenArmor);
policy.formatAffix(greenArmor.affixes[0]);
assert.equal(JSON.stringify(greenArmor.affixes), rerenderSnapshot, 'display helpers never reroll or mutate affixes');

const loaded = policy.normalizeEquipment(JSON.parse(JSON.stringify(greenArmor)));
assert.deepEqual(loaded.affixes, greenArmor.affixes, 'save and load preserve affix id and value');
const crafted = { id: 'crafted-1', kind: 'equipment', slot: 'cloak', sourceType: 'crafted', quality: 'epic', rarity: 'epic', primaryStat: { stat: 'itemFind', value: 8 }, affixes: [{ id: 'crafted-maxHp', stat: 'maxHp', value: 40 }] };
assert.deepEqual(policy.normalizeEquipment(JSON.parse(JSON.stringify(crafted))), crafted, 'crafted primary and final affixes survive normalization');
assert.equal(policy.getQualityLabel(crafted), '紫色');
assert.deepEqual(policy.normalizeEquipment({ ...armor, quality: undefined }).affixes, [], 'legacy equipment without affixes loads as white equipment');
assert.equal(policy.normalizeEquipment({ ...armor, quality: undefined }).quality, 'common');

const wornOnly = policy.getEquippedAffixStats({ armor: greenArmor, weapon: null });
assert.equal(wornOnly[greenArmor.affixes[0].stat], greenArmor.affixes[0].value);
assert.deepEqual(policy.getEquippedAffixStats({}), {}, 'an empty equipment set gains no backpack affixes');

const firstMember = policy.getEquippedAffixStats({ armor: greenArmor });
const secondMember = policy.getEquippedAffixStats({ weapon: greenWeapon });
assert.notDeepEqual(firstMember, secondMember, 'each party member aggregates only their own equipment object');

const malformed = policy.normalizeEquipment({ ...armor, quality: 'uncommon', affixes: [{ id: 'missing_affix', stat: 'maxHpPercent', value: 999 }] });
assert.equal(malformed.quality, 'common', 'invalid green data is repaired to a valid white item');
assert.deepEqual(malformed.affixes, [], 'unknown affixes cannot become active stats');

console.log('equipment-affix-policy: assertions passed');
