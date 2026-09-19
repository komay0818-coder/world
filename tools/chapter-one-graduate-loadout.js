'use strict';

const EquipmentPolicy = require('../equipment-policy.js');
const EquipmentDropPolicy = require('../equipment-drop-policy.js');

const TEMPLATE_INDEX = new Map([
  ...Object.values(EquipmentPolicy.WEAPON_CATALOG),
  ...Object.values(EquipmentPolicy.ARMOR_CATALOG),
  ...Object.values(EquipmentPolicy.OFFHAND_CATALOG)
].map(template => [template.id, template]));

const ITEM_IDS = Object.freeze({
  warrior: Object.freeze({
    weapon: 'short-iron-sword', offhand: 'wooden-round-shield', armor: 'starter-recruit-plate-armor',
    head: 'starter-recruit-iron-helmet', gloves: 'starter-recruit-iron-gauntlets',
    pants: 'guard-legguards', boots: 'starter-recruit-iron-boots'
  }),
  hunter: Object.freeze({
    weapon: 'hunter-shortbow', offhand: 'rough-quiver', armor: 'leather-vest', head: 'leather-hood',
    gloves: 'rough-leather-gloves', pants: 'leather-pants', boots: 'leather-short-boots'
  })
});

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function makeItem(job, slot, templateId, index) {
  const template = TEMPLATE_INDEX.get(templateId);
  if (!template) throw new Error(`Unknown chapter-one graduate template: ${templateId}`);
  const random = seeded(0x1c1500 + index * 7919 + (job === 'hunter' ? 313 : 0));
  const item = EquipmentDropPolicy.createEquipmentDropInstance(template, {
    rarity: 'uncommon', chapter: 1, jobId: job, affixRandom: random, socketRandom: random,
    instanceId: `chapter-one-graduate-${job}-${slot}`, obtainedFrom: slot === 'offhand' ? 'plains-depths' : 'chapter-one-normal-progression', obtainedAt: 1
  });
  item.sockets = 0;
  item.socketedRunes = [];
  return item;
}

function createLoadout(job) {
  const ids = ITEM_IDS[job];
  if (!ids) throw new Error(`Unsupported graduate job: ${job}`);
  return Object.fromEntries(Object.entries(ids).map(([slot, id], index) => [slot, makeItem(job, slot, id, index)]));
}

function describeLoadout(job) {
  return Object.entries(createLoadout(job)).map(([slot, item]) => ({
    slot, id: item.baseItemId, name: item.name, quality: item.quality,
    baseStats: item.baseStats, affixes: item.affixes.map(affix => ({ id: affix.id, name: affix.name, value: affix.value, unit: affix.unit }))
  }));
}

module.exports = Object.freeze({ ITEM_IDS, createLoadout, describeLoadout });

if (require.main === module) process.stdout.write(JSON.stringify({ warrior: describeLoadout('warrior'), hunter: describeLoadout('hunter') }, null, 2));
