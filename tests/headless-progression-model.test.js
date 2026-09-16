'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const EquipmentDropPolicy = require('../equipment-drop-policy.js');
const model = require('../tools/headless-progression-model.js');
const { runProgressionCombat } = require('../tools/formal-combat-entry.js');

const firstChapterGreen = {
  id: 'first-green-bow', instanceId: 'first-green-bow', kind: 'equipment', slot: 'weapon',
  weaponType: 'bow', allowedJobs: ['hunter'], attackMin: 9, attackMax: 13, attackSpeed: 1.1
};
const roster = model.createRoster([
  { characterId: 'a', slotId: 'slot-a', job: 'warrior', level: 20, gold: 10 },
  { characterId: 'b', slotId: 'slot-b', job: 'hunter', level: 15, equipment: { weapon: firstChapterGreen }, skillLevels: { 'hunter:power-shot': 1 } },
  { characterId: 'c', slotId: 'slot-c', job: 'mage', level: 15 }
]);

assert.equal(model.invitePartyMember(roster, 'a', 'b'), true);
assert.equal(model.invitePartyMember(roster, 'a', 'c'), true);
const initialSnapshot = model.getPartyMemberSnapshot(roster, 'a', 'b');
assert.equal(initialSnapshot.progress.level, 15);
assert.equal(initialSnapshot.progress.equipment.weapon.instanceId, 'first-green-bow');

const aBefore = structuredClone(model.getCharacter(roster, 'a').progress);
const cBefore = structuredClone(model.getCharacter(roster, 'c').progress);
model.applyCombatProgression(roster, 'b', { ...model.getCharacter(roster, 'b').progress, level: 18, xp: 7, gold: 88 });
assert.equal(model.getCharacter(roster, 'a').progress.level, aBefore.level, 'B growth cannot change A');
assert.deepEqual(model.getCharacter(roster, 'c').progress, cBefore, 'B growth cannot change C');

const guaranteedChapterTwoEnemy = {
  id: 'headless-chapter-two-drop', chapter: 2,
  lootConfig: { chapter: 2, equipmentDropRate: 1, rarityWeights: { uncommon: 1 }, equipmentPools: ['black_forest_weapons', 'black_forest_armor'] }
};
const values = [0, 0, .36, .1, .2, .3, .4, .5, .6, .7];
let randomIndex = 0;
const bDrop = model.grantEquipmentDrop(roster, 'b', guaranteedChapterTwoEnemy, {
  chapter: 2, mapId: 'black-forest-entrance', random: () => values[randomIndex++ % values.length], instanceIdFactory: () => 'b-second-chapter-drop'
});
assert.ok(bDrop, 'B independently receives a formal equipment drop');
assert.ok(model.getCharacter(roster, 'b').progress.inventory.some((item) => item.instanceId === 'b-second-chapter-drop'));
assert.equal(model.getCharacter(roster, 'b').progress.equipment.weapon.instanceId, 'b-second-chapter-drop', 'B conservatively equips its own clear weapon upgrade');
assert.equal(model.getCharacter(roster, 'a').progress.inventory.length, 0, 'B drop cannot enter A inventory');
assert.equal(model.getPartyMemberSnapshot(roster, 'a', 'b').progress.level, 15, 'B leveling does not refresh A snapshot');
assert.equal(model.getPartyMemberSnapshot(roster, 'a', 'b').progress.equipment.weapon.instanceId, 'first-green-bow', 'B equipment does not refresh A snapshot');

randomIndex = 0;
const laterDrop = model.grantEquipmentDrop(roster, 'b', guaranteedChapterTwoEnemy, {
  chapter: 2, mapId: 'spider-nest', random: () => values[randomIndex++ % values.length], instanceIdFactory: () => 'b-later-map-drop', autoEquip: false
});
assert.ok(laterDrop);
assert.ok(model.getCharacter(roster, 'b').progress.inventory.some((item) => item.instanceId === 'b-second-chapter-drop'));
assert.ok(model.getCharacter(roster, 'b').progress.inventory.some((item) => item.instanceId === 'b-later-map-drop'), 'formal equipment inventory persists across maps');

const nextBattle = model.createCombatConfig(roster, 'a', { mode: 'fixed-five' });
assert.equal(nextBattle.party[0].level, 15, 'new battle uses the saved level snapshot');
assert.equal(nextBattle.party[0].equipment.weapon.instanceId, 'first-green-bow', 'new battle uses saved equipment');
model.getCharacter(roster, 'a').progress.selectedMapId = 'spider-nest';
assert.equal(model.createCombatConfig(roster, 'a').party[0].level, 15, 'map changes do not refresh snapshots');

assert.equal(model.removePartyMember(roster, 'a', 'b'), true);
assert.equal(model.invitePartyMember(roster, 'a', 'b'), true);
const refreshed = model.getPartyMemberSnapshot(roster, 'a', 'b');
assert.equal(refreshed.progress.level, 18, 'reinvite refreshes level');
assert.deepEqual(refreshed.progress.equipment, model.getCharacter(roster, 'b').progress.equipment, 'reinvite refreshes equipment');

const unusable = { id: 'mage-only', instanceId: 'mage-only', kind: 'equipment', slot: 'weapon', weaponType: 'staff', allowedJobs: ['mage'], attackMin: 99, attackMax: 100, attackSpeed: 1 };
model.getCharacter(roster, 'b').progress.inventory.push(unusable);
assert.equal(model.applyConservativeEquipmentUpgrades(model.getCharacter(roster, 'b'), [unusable])[0].reason, 'not-wearable');
assert.ok(model.getCharacter(roster, 'b').progress.inventory.includes(unusable), 'unwearable equipment remains in owner inventory');

assert.equal(EquipmentDropPolicy.EQUIPMENT_POOLS.black_forest_weapons.length + EquipmentDropPolicy.EQUIPMENT_POOLS.black_forest_armor.length, 29, 'formal 29-template chapter-two weapon and armor pool remains available');
assert.equal(EquipmentDropPolicy.CHAPTER_TWO_TEMPLATES.length, 32, 'the three formal late-chapter offhands remain available in addition to the 29 core templates');
const source = fs.readFileSync(path.join(__dirname, '..', 'tools', 'headless-progression-model.js'), 'utf8');
assert.doesNotMatch(source, /equipmentScore|combatPower|powerScore/i, 'headless progression adds no hidden equipment score');

const combatRoster = model.createRoster([
  { characterId: 'leader', job: 'warrior', level: 20 },
  { characterId: 'ally', job: 'hunter', level: 15, equipment: { weapon: firstChapterGreen } }
]);
model.invitePartyMember(combatRoster, 'leader', 'ally');
model.getCharacter(combatRoster, 'ally').progress.level = 18;
const combat = runProgressionCombat(combatRoster, 'leader', {
  mode: 'fixed-five', seconds: .3, seed: 123, enemyDefinitions: { dummy: { id: 'dummy', name: 'Dummy', maxHp: 999999, defense: 0, attack: 0, attackSpeed: 1, level: 1, xp: 0, gold: 0, lootConfig: { chapter: 2, equipmentDropRate: 0, rarityWeights: { uncommon: 1 }, equipmentPools: ['black_forest_weapons'] } } },
  map: { id: 'black-forest-entrance', chapter: 2 }, initialTypes: ['dummy'], enemyCount: 1
});
const allyCombat = combat.party.final.find((entry) => entry.job === 'hunter');
assert.equal(allyCombat.level, 15, 'formal battle member is built from invitation snapshot');
assert.equal(allyCombat.equipment.weapon.instanceId, 'first-green-bow');
assert.ok(allyCombat.attack > 0 && allyCombat.defense >= 0 && allyCombat.maxHp > 0, 'snapshot battle stats are calculated by the formal combat formulas');
assert.equal(model.getCharacter(combatRoster, 'ally').progress.level, 18, 'leader combat does not award ally EXP');

console.log('headless-progression-model: assertions passed');
