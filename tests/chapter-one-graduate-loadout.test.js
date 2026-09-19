'use strict';
const assert = require('node:assert/strict');
const EquipmentPolicy = require('../equipment-policy.js');
const EquipmentDropPolicy = require('../equipment-drop-policy.js');
const Graduate = require('../tools/chapter-one-graduate-loadout.js');

const firstChapterPool = new Set([
  ...EquipmentDropPolicy.EQUIPMENT_POOLS.plains_common_weapons,
  ...EquipmentDropPolicy.EQUIPMENT_POOLS.plains_common_armor,
  ...Object.values(EquipmentPolicy.OFFHAND_CATALOG).map(item => item.id)
]);

for (const job of ['warrior', 'hunter']) {
  const first = Graduate.createLoadout(job);
  const second = Graduate.createLoadout(job);
  assert.deepEqual(first, second, `${job} fixture is deterministic`);
  assert.deepEqual(Object.keys(first).sort(), ['armor', 'boots', 'gloves', 'head', 'offhand', 'pants', 'weapon']);
  for (const [slot, item] of Object.entries(first)) {
    assert.equal(item.slot, slot);
    assert.equal(item.quality, 'uncommon');
    assert.equal(item.affixChapter, 1);
    assert.equal(item.affixes.length, 3);
    assert.equal(item.sockets, 0);
    assert.deepEqual(item.socketedRunes, []);
    assert.ok(firstChapterPool.has(item.baseItemId), `${item.baseItemId} is obtainable in chapter one`);
    assert.deepEqual(EquipmentPolicy.getEquipSlots(item, job), [slot]);
    assert.ok(item.affixes.every(affix => !['elite_damage_percent', 'boss_damage_percent'].includes(affix.id)));
  }
}

console.log('chapter-one graduate loadout tests passed');
