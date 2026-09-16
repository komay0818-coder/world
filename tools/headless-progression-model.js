'use strict';

const PartyPolicy = require('../party-policy.js');
const EquipmentPolicy = require('../equipment-policy.js');
const EquipmentDropPolicy = require('../equipment-drop-policy.js');

function clone(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function emptyEquipment() {
  return Object.fromEntries(['weapon', 'offhand', 'head', 'armor', 'gloves', 'pants', 'boots'].map((slot) => [slot, null]));
}

function createCharacterState(input = {}) {
  const characterId = String(input.characterId || input.id || input.slotId || 'headless-character');
  return {
    slotId: String(input.slotId || characterId),
    character: {
      id: characterId,
      name: input.name || characterId,
      job: input.job || 'warrior',
      race: input.race || 'human',
      faction: input.faction || 'light'
    },
    progress: {
      level: Math.max(1, Number(input.level) || 1),
      xp: Math.max(0, Number(input.xp) || 0),
      gold: Math.max(0, Number(input.gold) || 0),
      inventory: clone(input.inventory, []),
      equipment: { ...emptyEquipment(), ...clone(input.equipment, {}) },
      skillLevels: clone(input.skillLevels, {}),
      advancedClass: input.advancedClass || '',
      selectedMapId: input.selectedMapId || 'plains-entrance',
      blackForestCorruption: clone(input.blackForestCorruption, null),
      mapKillProgress: clone(input.mapKillProgress, {}),
      mapBossCleared: clone(input.mapBossCleared, {}),
      mapUnlocked: clone(input.mapUnlocked, {}),
      potions: Math.max(0, Number(input.potions) || 0),
      manaPotions: Math.max(0, Number(input.manaPotions) || 0)
    },
    party: { activeMemberIds: [characterId], memberSnapshots: {} },
    manualReview: []
  };
}

function createRoster(characters = []) {
  return { characters: Object.fromEntries(characters.map((entry) => {
    const state = createCharacterState(entry);
    return [state.character.id, state];
  })) };
}

function getCharacter(roster, characterId) {
  const state = roster?.characters?.[characterId];
  if (!state) throw new Error(`Unknown headless character: ${characterId}`);
  return state;
}

function partySlots(roster) {
  return Object.values(roster.characters).map((state) => ({ character: state.character, progress: state.progress }));
}

function normalizeLeaderParty(roster, leaderId) {
  const leader = getCharacter(roster, leaderId);
  const slots = partySlots(roster);
  const mainSlotIndex = slots.findIndex((slot) => slot.character.id === leaderId);
  leader.party = PartyPolicy.normalizeParty(leader.party, { slots, mainSlotIndex, mainCharacter: leader.character, mainProgress: leader.progress });
  return leader.party;
}

function invitePartyMember(roster, leaderId, memberId) {
  const leader = getCharacter(roster, leaderId);
  getCharacter(roster, memberId);
  const party = normalizeLeaderParty(roster, leaderId);
  if (!PartyPolicy.addActiveMember(party, memberId, { slots: partySlots(roster) })) return false;
  leader.party = PartyPolicy.normalizeParty(party, { slots: partySlots(roster), mainSlotIndex: partySlots(roster).findIndex((slot) => slot.character.id === leaderId) });
  return true;
}

function removePartyMember(roster, leaderId, memberId) {
  const leader = getCharacter(roster, leaderId);
  const party = normalizeLeaderParty(roster, leaderId);
  const removed = PartyPolicy.removeActiveMember(party, memberId);
  leader.party = party;
  return removed;
}

function getPartyMemberSnapshot(roster, leaderId, memberId) {
  return clone(normalizeLeaderParty(roster, leaderId).memberSnapshots?.[memberId]);
}

function baseStat(item, key) {
  return Number(item?.baseStats?.[key] ?? item?.[key]) || 0;
}

function averageWeaponDamage(item) {
  const minimum = Number(item?.baseStats?.attackMin ?? item?.attackMin);
  const maximum = Number(item?.baseStats?.attackMax ?? item?.attackMax);
  if (Number.isFinite(minimum) && Number.isFinite(maximum)) return (minimum + maximum) / 2;
  return Number(item?.baseStats?.attack ?? item?.attack) || 0;
}

function weaponStructure(item) {
  if (!item) return 'none';
  if (EquipmentPolicy.isOneHandedWeapon(item)) return 'one-handed';
  if (String(item.weaponType || '').startsWith('two-handed-') || item.weaponType === 'staff' || item.weaponType === 'bow') return 'two-handed';
  return String(item.weaponType || item.series || 'unknown');
}

function evaluateUpgrade(state, item) {
  if (!item || item.kind !== 'equipment') return { action: 'ignore', reason: 'not-equipment' };
  if (!EquipmentPolicy.canEquipInSlot(item, state.character.job, item.slot)) return { action: 'keep', reason: 'not-wearable' };
  const current = state.progress.equipment[item.slot];
  if (!current) return { action: 'equip', slot: item.slot, reason: 'empty-slot' };
  if (item.slot === 'weapon') {
    if (weaponStructure(item) !== weaponStructure(current)) return { action: 'manual-review', reason: 'weapon-structure-change' };
    const oldAverage = averageWeaponDamage(current);
    const newAverage = averageWeaponDamage(item);
    const oldDps = oldAverage * EquipmentPolicy.getAttacksPerSecond(current, 1);
    const newDps = newAverage * EquipmentPolicy.getAttacksPerSecond(item, 1);
    return newAverage > oldAverage && newDps > oldDps
      ? { action: 'equip', slot: item.slot, reason: 'weapon-damage-and-dps-upgrade' }
      : { action: 'keep', reason: 'weapon-not-strict-upgrade' };
  }
  if (item.slot === 'offhand') return { action: 'manual-review', reason: 'offhand-structure-review' };
  const oldDefense = baseStat(current, 'defense');
  const oldHp = baseStat(current, 'hp');
  const newDefense = baseStat(item, 'defense');
  const newHp = baseStat(item, 'hp');
  return newDefense >= oldDefense && newHp >= oldHp && (newDefense > oldDefense || newHp > oldHp)
    ? { action: 'equip', slot: item.slot, reason: 'armor-defense-hp-upgrade' }
    : { action: 'keep', reason: 'armor-not-strict-upgrade' };
}

function applyConservativeEquipmentUpgrades(state, items = state.progress.inventory) {
  const decisions = [];
  for (const item of items) {
    const decision = { itemId: item?.instanceId || item?.id, ...evaluateUpgrade(state, item) };
    decisions.push(decision);
    if (decision.action === 'equip') state.progress.equipment[decision.slot] = clone(item);
    if (decision.action === 'manual-review') state.manualReview.push(decision);
  }
  return decisions;
}

function grantEquipmentDrop(roster, characterId, enemy, options = {}) {
  const state = getCharacter(roster, characterId);
  const item = EquipmentDropPolicy.grantEquipmentDrop(state.progress, enemy, options);
  if (item && options.autoEquip !== false) applyConservativeEquipmentUpgrades(state, [item]);
  return item;
}

function applyCombatProgression(roster, leaderId, progression) {
  const leader = getCharacter(roster, leaderId);
  const preservedParty = leader.party;
  const next = clone(progression, {});
  Object.assign(leader.progress, next);
  leader.party = preservedParty;
  return leader;
}

function createCombatConfig(roster, leaderId, overrides = {}) {
  const leader = getCharacter(roster, leaderId);
  const party = normalizeLeaderParty(roster, leaderId);
  const allies = party.activeMemberIds.slice(1).map((memberId) => {
    const snapshot = party.memberSnapshots[memberId];
    return {
      characterId: memberId,
      job: snapshot.character.job,
      race: snapshot.character.race,
      faction: snapshot.character.faction,
      level: snapshot.progress.level,
      advancedClass: snapshot.progress.advancedClass,
      equipment: clone(snapshot.progress.equipment, {}),
      skills: { levels: clone(snapshot.progress.skillLevels, {}) },
      exactSkillLevels: true,
      blackForestCorruption: clone(snapshot.progress.blackForestCorruption, null)
    };
  });
  return {
    ...overrides,
    characterId: leader.character.id,
    job: leader.character.job,
    race: leader.character.race,
    faction: leader.character.faction,
    level: leader.progress.level,
    advancedClass: leader.progress.advancedClass,
    equipment: clone(leader.progress.equipment, {}),
    skills: { levels: clone(leader.progress.skillLevels, {}) },
    exactSkillLevels: true,
    initialProgress: clone(leader.progress, {}),
    party: allies
  };
}

module.exports = {
  createCharacterState,
  createRoster,
  getCharacter,
  invitePartyMember,
  removePartyMember,
  getPartyMemberSnapshot,
  evaluateUpgrade,
  applyConservativeEquipmentUpgrades,
  grantEquipmentDrop,
  applyCombatProgression,
  createCombatConfig
};
