'use strict';
const assert = require('node:assert/strict');
const policy = require('../equipment-affix-policy.js');

function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

const expectedWeights = {
  1: { 1: .55, 2: .35, 3: .10 },
  2: { 1: .45, 2: .35, 3: .17, 4: .03 },
  3: { 1: .40, 2: .35, 3: .20, 4: .05 }
};
const sampleSize = 100000;
const samples = {};
for (const chapter of [1, 2, 3]) {
  const random = randomSource(8000 + chapter), counts = {};
  const template = { id: `sample-weapon-${chapter}`, kind: 'equipment', slot: 'weapon' };
  for (let index = 0; index < sampleSize; index++) {
    const affix = policy.rollEquipmentAffixes(template, 1, random, 1, [], { chapter, quality: 'rare' })[0];
    assert(affix, `chapter ${chapter} produces an affix`);
    counts[affix.affixGrade] = (counts[affix.affixGrade] || 0) + 1;
    assert.equal(affix.valueQuality, 1);
    assert.equal(affix.slotKey, 'random-0');
  }
  samples[chapter] = Object.fromEntries(Object.entries(counts).map(([grade, count]) => [grade, count / sampleSize]));
  for (const [grade, expected] of Object.entries(expectedWeights[chapter])) assert(Math.abs((counts[grade] || 0) / sampleSize - expected) < .01, `chapter ${chapter} grade ${grade} stays within one percentage point`);
  assert.equal(Object.keys(counts).some((grade) => Number(grade) > (chapter === 1 ? 3 : 4)), false);
}

const redistributedRandom = randomSource(44002), redistributedCounts = { 1: 0, 4: 0 };
const redistributedTemplate = { id: 'redistributed-weapon', kind: 'equipment', slot: 'weapon', allowedAffixIds: ['max_hp_flat', 'boss_damage_percent'] };
for (let index = 0; index < sampleSize; index++) {
  const affix = policy.rollEquipmentAffixes(redistributedTemplate, 1, redistributedRandom, 1, [], { chapter: 2, quality: 'rare' })[0];
  redistributedCounts[affix.affixGrade]++;
}
assert(Math.abs(redistributedCounts[1] / sampleSize - .45 / .48) < .01, 'unavailable grade weights redistribute over legal grades');
assert(Math.abs(redistributedCounts[4] / sampleSize - .03 / .48) < .01, 'the remaining purple weight is normalized rather than bypassing legality');

assert.equal(policy.getAffixGrade('poison_resistance_percent'), 2);
assert.equal(policy.getAffixGrade('control_resistance_percent'), 2, 'the current resistance family follows the grade-two rule');
assert.equal(policy.getAvailableAffixes({ kind: 'equipment', slot: 'armor' }, [], { chapter: 2, quality: 'rare' }).some((entry) => entry.id === 'poison_resistance_percent'), true);
assert.equal(policy.getAvailableAffixes({ kind: 'equipment', slot: 'armor' }, [], { chapter: 3, quality: 'rare' }).some((entry) => entry.id === 'poison_resistance_percent'), false);

const templates = [
  { id: 'legal-weapon', kind: 'equipment', slot: 'weapon' },
  { id: 'legal-armor', kind: 'equipment', slot: 'armor' },
  { id: 'legal-ring', kind: 'equipment', slot: 'ring1' }
];
for (const chapter of [1, 2, 3]) for (const template of templates) {
  const random = randomSource(chapter * 100 + template.id.length);
  for (let index = 0; index < 500; index++) {
    const item = policy.createEquipmentInstance(template, { quality: 'epic', chapter, uniqueId: `${chapter}-${index}`, random });
    assert.equal(item.affixSchemaVersion, 5);
    assert.deepEqual(item.reforgeState, { version: 1, lockedTypeSlotKey: null });
    assert.deepEqual(item.affixes, [...item.fixedAffixes, ...item.randomAffixes]);
    assert.deepEqual(policy.normalizeEquipment(JSON.parse(JSON.stringify(item))), item);
    const randomStats = item.randomAffixes.flatMap((entry) => entry.components.map((component) => component.stat));
    assert.equal(new Set(randomStats).size, randomStats.length, 'one item never duplicates a random stat');
    item.randomAffixes.forEach((entry, slotIndex) => {
      const definition = policy.EQUIPMENT_AFFIXES[entry.id];
      assert(policy.isDefinitionUnlocked(definition, item, { chapter, quality: 'epic' }));
      assert.equal(entry.slotKey, `random-${slotIndex}`);
      assert.equal(entry.affixGrade, policy.getAffixGrade(definition));
      assert.equal(entry.valueQuality, 1);
      if (entry.components.length === 1) assert.equal(entry.value, entry.components[0].value);
      assert(!['experience_gain_percent', 'gold_gain_percent', 'item_find_percent'].includes(entry.id));
    });
  }
}

const fixedValuesByChapter = new Map();
for (const chapter of [1, 2, 3]) {
  const random = randomSource(17000 + chapter), template = { id: `fixed-values-${chapter}`, kind: 'equipment', slot: 'weapon' };
  for (let index = 0; index < 10000; index++) {
    const entry = policy.rollEquipmentAffixes(template, 1, random, 1, [], { chapter, quality: 'rare' })[0];
    const key = `${chapter}:${entry.id}`, values = entry.components.map((component) => component.value);
    if (fixedValuesByChapter.has(key)) assert.deepEqual(values, fixedValuesByChapter.get(key), 'initial values never roll within the same chapter and affix type');
    else fixedValuesByChapter.set(key, values);
  }
}

const composite = policy.rollEquipmentAffixes({ id: 'composite', kind: 'equipment', slot: 'weapon', allowedAffixIds: ['chapter2_berserker'] }, 1, () => .5, 1, [], { chapter: 2, quality: 'rare' })[0];
assert.equal(composite.affixGrade, 4);
assert.equal(composite.valueQuality, 1);
assert.deepEqual(composite.components.map((entry) => entry.value), [4, 5]);
const compositeItem = policy.createEquipmentInstance({ id: 'composite-item', kind: 'equipment', slot: 'weapon', fixedAffixIds: [], allowedAffixIds: ['chapter2_berserker'], affixRuleOverride: { fixedCount: 0, randomCount: 1 } }, { quality: 'rare', chapter: 2, uniqueId: 'one', random: () => .5 });
assert.deepEqual(policy.normalizeEquipment(JSON.parse(JSON.stringify(compositeItem))), compositeItem);

console.log('equipment-affix-generation-v5: ' + JSON.stringify({ sampleSize, samples, redistributed: { 1: redistributedCounts[1] / sampleSize, 4: redistributedCounts[4] / sampleSize } }));
