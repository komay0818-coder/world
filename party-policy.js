(function (root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  root.PartyPolicy = policy;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_PARTY_SIZE = 4;
  const UNLOCK_LEVELS = Object.freeze([1, 10, 20, 30]);

  function getUnlockedPartySlots(level) {
    const safeLevel = Math.max(1, Number(level) || 1);
    if (safeLevel >= 30) return 4;
    if (safeLevel >= 20) return 3;
    if (safeLevel >= 10) return 2;
    return 1;
  }

  function getPartySlotUnlockLevel(slotIndex) {
    return UNLOCK_LEVELS[Math.max(0, Math.min(MAX_PARTY_SIZE - 1, Number(slotIndex) || 0))];
  }

  function ensureCharacterId(character, slotIndex = 0) {
    if (!character || typeof character !== 'object') return null;
    if (!character.id) character.id = `character-slot-${slotIndex + 1}`;
    return character.id;
  }

  function getResourceType(job) {
    if (job === 'warrior') return 'rage';
    if (job === 'assassin') return 'energy';
    if (job === 'hunter') return 'arrows';
    return 'mana';
  }

  function createMemberRecord(slot, slotIndex = 0) {
    if (!slot?.character) return null;
    const id = ensureCharacterId(slot.character, slotIndex);
    const progress = slot.progress && typeof slot.progress === 'object' ? slot.progress : {};
    const level = Math.max(1, Number(progress.level) || 1);
    const maxHp = Math.max(1, Number(progress.partyMemberState?.maxHp) || 1);
    const currentHp = Math.max(0, Math.min(maxHp, Number(progress.partyMemberState?.currentHp) || maxHp));
    const resourceType = getResourceType(slot.character.job);
    return {
      id,
      slotIndex,
      name: slot.character.name || `隊員 ${slotIndex + 1}`,
      faction: slot.character.faction || 'light',
      race: slot.character.race || 'human',
      job: slot.character.job || 'warrior',
      level,
      currentHp,
      maxHp,
      resource: {
        type: resourceType,
        current: Math.max(0, Number(progress.partyMemberState?.resource?.current) || 0),
        max: Math.max(0, Number(progress.partyMemberState?.resource?.max) || 0)
      },
      attack: Math.max(0, Number(progress.partyMemberState?.attack) || 0),
      defense: Math.max(0, Number(progress.partyMemberState?.defense) || 0),
      attackSpeed: Math.max(.01, Number(progress.partyMemberState?.attackSpeed) || 1),
      skillCooldowns: {},
      equipment: progress.equipment && typeof progress.equipment === 'object' ? progress.equipment : {},
      alive: currentHp > 0,
      nextAttackAt: 0
    };
  }

  function normalizeParty(party, options = {}) {
    const slots = Array.isArray(options.slots) ? options.slots : [];
    const mainSlotIndex = Math.max(0, Number(options.mainSlotIndex) || 0);
    const mainSlot = slots[mainSlotIndex] || {
      character: options.mainCharacter,
      progress: options.mainProgress
    };
    if (!mainSlot?.character) {
      return { activeMemberIds: [], unlockedSlots: 1, members: [] };
    }
    const mainId = ensureCharacterId(mainSlot.character, mainSlotIndex);
    const mainLevel = Math.max(1, Number(mainSlot.progress?.level) || Number(options.mainProgress?.level) || 1);
    const unlockedSlots = getUnlockedPartySlots(mainLevel);
    const members = slots
      .map((slot, slotIndex) => createMemberRecord(slot, slotIndex))
      .filter(Boolean);
    if (!members.some((member) => member.id === mainId)) {
      const mainMember = createMemberRecord(mainSlot, mainSlotIndex);
      if (mainMember) members.unshift(mainMember);
    }
    const knownIds = new Set(members.map((member) => member.id));
    const requestedIds = Array.isArray(party?.activeMemberIds) ? party.activeMemberIds : [];
    const activeMemberIds = [mainId, ...requestedIds.filter((id) => id !== mainId && knownIds.has(id))]
      .slice(0, unlockedSlots);
    return {
      activeMemberIds: [...new Set(activeMemberIds)],
      unlockedSlots,
      members
    };
  }

  function getAliveMembers(members) {
    return (Array.isArray(members) ? members : []).filter((member) => member && member.alive !== false && member.currentHp > 0);
  }

  function chooseRandomAliveMember(members, random = Math.random) {
    const alive = getAliveMembers(members);
    if (!alive.length) return null;
    if (alive.length === 1) return alive[0];
    const roll = Math.max(0, Math.min(.999999, Number(random()) || 0));
    return alive[Math.floor(roll * alive.length)];
  }

  function getFrontAliveEnemyIndex(enemyHps, enemySpawnedAt = []) {
    const alive = (Array.isArray(enemyHps) ? enemyHps : [])
      .map((hp, index) => ({ hp, index, spawnedAt: Number(enemySpawnedAt[index]) || index }))
      .filter((enemy) => enemy.hp > 0)
      .sort((first, second) => first.spawnedAt - second.spawnedAt || first.index - second.index);
    return alive.length ? alive[0].index : -1;
  }

  function isPartyDefeated(members) {
    return getAliveMembers(members).length === 0;
  }

  return Object.freeze({
    MAX_PARTY_SIZE,
    UNLOCK_LEVELS,
    getUnlockedPartySlots,
    getPartySlotUnlockLevel,
    ensureCharacterId,
    getResourceType,
    createMemberRecord,
    normalizeParty,
    getAliveMembers,
    chooseRandomAliveMember,
    getFrontAliveEnemyIndex,
    isPartyDefeated
  });
});
