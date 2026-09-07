const assert = require('node:assert');
const EquipmentPolicy = require('../equipment-policy.js');
const AffixPolicy = require('../equipment-affix-policy.js');
const DropPolicy = require('../equipment-drop-policy.js');

function sequence(values) { let index = 0; return () => values[Math.min(index++, values.length - 1)]; }

for (const [key, templateRoll] of [['woodenRoundShield', 0], ['roughQuiver', .4], ['beginnerSpellbook', .8]]) {
  const template = EquipmentPolicy.OFFHAND_CATALOG[key];
  const item = DropPolicy.createChapterOneOffhandDrop({ random: sequence([templateRoll, 0, .4, .8, .2]), instanceId: `offhand-${key}` });
  assert.equal(item.templateId, template.id);
  assert.equal(item.quality, 'uncommon');
  assert.equal(item.fixedAffixes.length, 1);
  assert.equal(item.randomAffixes.length, 2);
  assert.ok(item.affixes.every((affix) => template.allowedAffixIds.includes(affix.id)), `${key} only rolls allowed formal affixes`);
  assert.equal(new Set(item.affixes.map((affix) => affix.id)).size, 3, `${key} does not roll duplicate affixes`);
}

const chapterTwoOffhands = DropPolicy.CHAPTER_TWO_TEMPLATES.filter((template) => template.slot === 'offhand');
assert.deepEqual(chapterTwoOffhands.map((template) => template.name), ['黑鐵守衛圓盾', '深林獵手箭筒', '靈森魔導書']);
assert.deepEqual(chapterTwoOffhands.map((template) => [template.defense || 0, template.parry || 0, template.maxArrows || 0, template.arrowRecoveryInterval || 0, template.mana || 0, template.manaRegenFlat || 0]), [
  [10, .04, 0, 0, 0, 0], [0, 0, 11, 1000 / 1.2, 0, 0], [0, 0, 0, 0, 50, 2]
]);
for (const template of chapterTwoOffhands) {
  const item = DropPolicy.createEquipmentDropInstance(template, { rarity: 'uncommon', chapter: 2, instanceId: `chapter2-${template.id}`, affixRandom: sequence([0, .35, .75, .2]) });
  assert.equal(item.quality, 'uncommon');
  assert.equal(item.fixedAffixes.length, 1);
  assert.equal(item.randomAffixes.length, 2);
  assert.ok(item.affixes.every((affix) => template.allowedAffixIds.includes(affix.id)), `${template.name} only rolls allowed formal affixes`);
}

const shieldAffixes = AffixPolicy.getAvailableAffixes(chapterTwoOffhands[0], [], { chapter: 2, quality: 'uncommon', jobId: 'warrior' });
assert.ok(shieldAffixes.every((affix) => !['mana_regeneration_percent', 'mage_fireball_damage'].includes(affix.id)), 'shields cannot roll caster affixes');
const spellbookAffixes = AffixPolicy.getAvailableAffixes(chapterTwoOffhands[2], [], { chapter: 2, quality: 'uncommon', jobId: 'priest' });
assert.ok(spellbookAffixes.every((affix) => !['defense_percent', 'dodge_percent'].includes(affix.id)), 'spellbooks cannot roll armor-only affixes');
assert.deepEqual(DropPolicy.EQUIPMENT_POOLS.late_chapter_two_offhands, chapterTwoOffhands.map((template) => template.id));
const lateDrop = DropPolicy.grantEquipmentDrop({ inventory: [] }, { id: 'altar-test', chapter: 2, lootConfig: { equipmentDropRate: 1, rarityWeights: { uncommon: 1 }, equipmentPools: ['black_forest_armor'] } }, { mapId: 'forest-altar', chapter: 2, random: sequence([0, 0, .999, 0, .4, .8, .2]), instanceIdFactory: () => 'late-offhand' });
assert.equal(lateDrop.slot, 'offhand', 'map 2-5 adds the late chapter-two offhand pool');
assert.equal(lateDrop.quality, 'uncommon', 'late chapter-two offhands stay green regardless of the general rarity table');
const earlyDrop = DropPolicy.grantEquipmentDrop({ inventory: [] }, { id: 'trail-test', chapter: 2, lootConfig: { equipmentDropRate: 1, rarityWeights: { rare: 1 }, equipmentPools: ['black_forest_armor'] } }, { mapId: 'black-forest-trail', chapter: 2, random: sequence([0, 0, .999, 0, .4, .8]), instanceIdFactory: () => 'early-armor' });
assert.notEqual(earlyDrop.slot, 'offhand', 'maps before 2-5 do not use the late offhand pool');

const migrated = DropPolicy.migrateLegacyOffhand({ id: 'rough-quiver-old', instanceId: 'rough-quiver-old', baseItemId: 'rough-quiver', kind: 'equipment', affix: { name: '擴充' }, maxArrows: 12 }, { random: sequence([0, .4, .8]) });
assert.equal(migrated.baseItemId, 'rough-quiver');
assert.equal(migrated.maxArrows, 10, 'legacy exclusive affix stats are removed during migration');
assert.equal(migrated.affix, undefined, 'legacy exclusive affix metadata is removed during migration');
assert.equal(migrated.fixedAffixes.length, 1);
assert.equal(migrated.randomAffixes.length, 2);

console.log('offhand-affix-system: assertions passed');
