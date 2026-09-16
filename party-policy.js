(function (root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  root.PartyPolicy = policy;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_PARTY_SIZE = 3;
  const INVITATION_SNAPSHOT_VERSION = 1;
  const UNLOCK_LEVELS = Object.freeze([1, 10, 20]);
  const TARGET_WEIGHTS = Object.freeze({ warrior: 3, default: 1 });

  function getUnlockedPartySlots(level) {
    const safeLevel = Math.max(1, Number(level) || 1);
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

  function ensureUniqueCharacterIds(slots) {
    const seen = new Set();
    (Array.isArray(slots) ? slots : []).forEach((slot, slotIndex) => {
      if (!slot?.character) return;
      let id = typeof slot.character.id === 'string' ? slot.character.id.trim() : '';
      if (!id || seen.has(id)) {
        const base = `character-slot-${slotIndex + 1}`;
        id = base;
        let suffix = 2;
        while (seen.has(id)) id = `${base}-${suffix++}`;
        slot.character.id = id;
      }
      seen.add(id);
    });
    return slots;
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

  function cloneSnapshotValue(value, fallback) {
    if (value === undefined || value === null) return fallback;
    try { return JSON.parse(JSON.stringify(value)); } catch (_error) { return fallback; }
  }

  function createInvitationSnapshot(slot, slotIndex = 0) {
    if (!slot?.character) return null;
    const id = ensureCharacterId(slot.character, slotIndex);
    const progress = slot.progress && typeof slot.progress === 'object' ? slot.progress : {};
    return {
      version: INVITATION_SNAPSHOT_VERSION,
      characterId: id,
      slotIndex,
      character: {
        id,
        name: slot.character.name || `隊員 ${slotIndex + 1}`,
        faction: slot.character.faction || 'light',
        race: slot.character.race || 'human',
        job: slot.character.job || 'warrior'
      },
      progress: {
        level: Math.max(1, Number(progress.level) || 1),
        advancedClass: typeof progress.advancedClass === 'string' ? progress.advancedClass : '',
        equipment: cloneSnapshotValue(progress.equipment, {}),
        skillLevels: cloneSnapshotValue(progress.skillLevels, {}),
        blackForestCorruption: cloneSnapshotValue(progress.blackForestCorruption, null)
      }
    };
  }

  function isValidInvitationSnapshot(snapshot, memberId) {
    return Boolean(snapshot
      && snapshot.version === INVITATION_SNAPSHOT_VERSION
      && snapshot.characterId === memberId
      && snapshot.character?.id === memberId
      && snapshot.progress
      && Number(snapshot.progress.level) >= 1
      && snapshot.progress.equipment && typeof snapshot.progress.equipment === 'object'
      && snapshot.progress.skillLevels && typeof snapshot.progress.skillLevels === 'object');
  }

  function createSlotFromInvitationSnapshot(snapshot, runtimeState = null, battleContext = null) {
    if (!isValidInvitationSnapshot(snapshot, snapshot?.characterId)) return null;
    const progress = cloneSnapshotValue(snapshot.progress, {});
    if (runtimeState && typeof runtimeState === 'object') progress.partyMemberState = cloneSnapshotValue(runtimeState, {});
    if (battleContext?.selectedMapId) progress.selectedMapId = battleContext.selectedMapId;
    return {
      character: cloneSnapshotValue(snapshot.character, null),
      progress
    };
  }

  function normalizeParty(party, options = {}) {
    const slots = Array.isArray(options.slots) ? options.slots : [];
    ensureUniqueCharacterIds(slots);
    const requestedMainIndex = Math.max(0, Math.floor(Number(options.mainSlotIndex) || 0));
    const mainSlotIndex = slots[requestedMainIndex]?.character
      ? requestedMainIndex
      : Math.max(0, slots.findIndex((slot) => slot?.character && slot.character.id === options.mainCharacter?.id));
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
    const liveMembers = slots
      .map((slot, slotIndex) => createMemberRecord(slot, slotIndex))
      .filter(Boolean);
    if (!liveMembers.some((member) => member.id === mainId)) {
      const mainMember = createMemberRecord(mainSlot, mainSlotIndex);
      if (mainMember) liveMembers.unshift(mainMember);
    }
    const knownIds = new Set(liveMembers.map((member) => member.id));
    const requestedIds = Array.isArray(party?.activeMemberIds) ? party.activeMemberIds : [];
    const activeMemberIds = [...new Set([mainId, ...requestedIds.filter((id) => id !== mainId && knownIds.has(id))])]
      .slice(0, Math.min(unlockedSlots, MAX_PARTY_SIZE));
    const previousSnapshots = party?.memberSnapshots && typeof party.memberSnapshots === 'object' ? party.memberSnapshots : {};
    const memberSnapshots = {};
    activeMemberIds.slice(1).forEach((memberId) => {
      if (isValidInvitationSnapshot(previousSnapshots[memberId], memberId)) {
        memberSnapshots[memberId] = cloneSnapshotValue(previousSnapshots[memberId], null);
        return;
      }
      const slotIndex = slots.findIndex((slot) => slot?.character?.id === memberId);
      const migrated = createInvitationSnapshot(slots[slotIndex], slotIndex);
      if (migrated) memberSnapshots[memberId] = migrated;
    });
    const members = liveMembers.map((member) => {
      const snapshot = memberSnapshots[member.id];
      if (!snapshot) return member;
      return createMemberRecord(createSlotFromInvitationSnapshot(snapshot), snapshot.slotIndex);
    });
    return {
      activeMemberIds: [...new Set(activeMemberIds)],
      unlockedSlots,
      members,
      memberSnapshots,
      invitationSnapshotVersion: INVITATION_SNAPSHOT_VERSION
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
    const weighted = alive.map((member) => ({ member, weight: member.job === 'warrior' ? TARGET_WEIGHTS.warrior : TARGET_WEIGHTS.default }));
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = roll * totalWeight;
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor < 0) return entry.member;
    }
    return weighted[weighted.length - 1].member;
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

  function canMemberAttack(member, now = Date.now()) {
    return Boolean(member && member.alive !== false && member.currentHp > 0
      && now >= (Number(member.stunnedUntil) || 0)
      && now >= (Number(member.nextAttackAt) || 0));
  }

  function scheduleNextAttack(member, now, attackSpeed, multiplier = 1) {
    const interval = 1000 / Math.max(.01, Number(attackSpeed) || .01) * Math.max(.01, Number(multiplier) || 1);
    member.nextAttackAt = Number(now) + interval;
    return member.nextAttackAt;
  }

  function claimEnemyReward(rewardedKeys, enemyIndex, spawnedAt) {
    const keys = rewardedKeys instanceof Set ? rewardedKeys : new Set();
    const rewardKey = `${enemyIndex}:${Number(spawnedAt) || 0}`;
    if (keys.has(rewardKey)) return { claimed: false, rewardKey, rewardedKeys: keys };
    keys.add(rewardKey);
    return { claimed: true, rewardKey, rewardedKeys: keys };
  }

  function addActiveMember(party, memberId, options = {}) {
    if (!party || party.activeMemberIds.includes(memberId)) return false;
    if (party.activeMemberIds.length >= Math.min(party.unlockedSlots, MAX_PARTY_SIZE)) return false;
    if (!party.members.some((member) => member.id === memberId)) return false;
    const slots = Array.isArray(options.slots) ? options.slots : [];
    const slotIndex = slots.findIndex((slot) => slot?.character?.id === memberId);
    const snapshot = createInvitationSnapshot(slots[slotIndex], slotIndex);
    if (!snapshot) return false;
    party.activeMemberIds.push(memberId);
    party.memberSnapshots = party.memberSnapshots && typeof party.memberSnapshots === 'object' ? party.memberSnapshots : {};
    party.memberSnapshots[memberId] = snapshot;
    party.invitationSnapshotVersion = INVITATION_SNAPSHOT_VERSION;
    return true;
  }

  function removeActiveMember(party, memberId) {
    if (!party || memberId === party.activeMemberIds[0] || !party.activeMemberIds.includes(memberId)) return false;
    party.activeMemberIds = party.activeMemberIds.filter((id) => id !== memberId);
    if (party.memberSnapshots && typeof party.memberSnapshots === 'object') delete party.memberSnapshots[memberId];
    return true;
  }

  return Object.freeze({
    MAX_PARTY_SIZE,
    INVITATION_SNAPSHOT_VERSION,
    UNLOCK_LEVELS,
    TARGET_WEIGHTS,
    getUnlockedPartySlots,
    getPartySlotUnlockLevel,
    ensureCharacterId,
    ensureUniqueCharacterIds,
    getResourceType,
    createMemberRecord,
    createInvitationSnapshot,
    isValidInvitationSnapshot,
    createSlotFromInvitationSnapshot,
    normalizeParty,
    getAliveMembers,
    chooseRandomAliveMember,
    getFrontAliveEnemyIndex,
    isPartyDefeated,
    canMemberAttack,
    scheduleNextAttack,
    claimEnemyReward,
    addActiveMember,
    removeActiveMember
  });
});
