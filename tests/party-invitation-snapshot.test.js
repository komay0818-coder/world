const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const party = require('../party-policy.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function slots(hunterLevel = 1, weaponId = 'starter-bow', skillLevel = 1) {
  return [
    { character: { id: 'leader', name: 'Leader', race: 'human', job: 'warrior' }, progress: { level: 20, equipment: {}, skillLevels: {} } },
    { character: { id: 'hunter', name: 'Hunter', race: 'elf', job: 'hunter' }, progress: { level: hunterLevel, equipment: { weapon: { id: weaponId } }, skillLevels: { 'hunter:power-shot': skillLevel }, blackForestCorruption: { stacks: hunterLevel === 1 ? 6 : 2 } } }
  ];
}

const originalSlots = slots();
let savedParty = party.normalizeParty(null, { slots: originalSlots, mainSlotIndex: 0 });
assert.equal(party.addActiveMember(savedParty, 'hunter', { slots: originalSlots }), true, 'invite creates a snapshot');
savedParty = party.normalizeParty(savedParty, { slots: originalSlots, mainSlotIndex: 0 });
assert.equal(savedParty.memberSnapshots.hunter.progress.level, 1);
assert.equal(savedParty.memberSnapshots.hunter.progress.equipment.weapon.id, 'starter-bow');
assert.equal(savedParty.memberSnapshots.hunter.progress.skillLevels['hunter:power-shot'], 1);

const grownSlots = slots(15, 'forest-bow', 6);
const afterIndependentGrowth = party.normalizeParty(savedParty, { slots: grownSlots, mainSlotIndex: 0 });
assert.equal(afterIndependentGrowth.memberSnapshots.hunter.progress.level, 1, 'independent leveling does not refresh an existing snapshot');
assert.equal(afterIndependentGrowth.memberSnapshots.hunter.progress.equipment.weapon.id, 'starter-bow', 'independent equipment changes do not refresh an existing snapshot');
assert.equal(afterIndependentGrowth.memberSnapshots.hunter.progress.skillLevels['hunter:power-shot'], 1, 'independent skill upgrades do not refresh an existing snapshot');
assert.equal(afterIndependentGrowth.memberSnapshots.hunter.progress.blackForestCorruption.stacks, 6, 'independent long-term corruption changes do not refresh an existing snapshot');

const reloaded = party.normalizeParty(JSON.parse(JSON.stringify(afterIndependentGrowth)), { slots: grownSlots, mainSlotIndex: 0 });
assert.equal(reloaded.memberSnapshots.hunter.progress.level, 1, 'save/load preserves the invitation snapshot');
const battleSlot = party.createSlotFromInvitationSnapshot(reloaded.memberSnapshots.hunter, { currentHp: 5 }, { selectedMapId: 'spider-nest' });
assert.equal(battleSlot.progress.level, 1, 'new battles use the saved snapshot');
assert.equal(battleSlot.progress.equipment.weapon.id, 'starter-bow', 'map and battle rebuilds use snapshot equipment');
assert.equal(battleSlot.progress.partyMemberState.currentHp, 5, 'temporary runtime state remains separate from long-term data');
assert.equal(battleSlot.progress.selectedMapId, 'spider-nest', 'the current battle map is context rather than frozen cultivation data');

assert.equal(party.removeActiveMember(reloaded, 'hunter'), true);
assert.equal(reloaded.memberSnapshots.hunter, undefined, 'removing a member deletes the snapshot');
assert.equal(party.addActiveMember(reloaded, 'hunter', { slots: grownSlots }), true);
assert.equal(reloaded.memberSnapshots.hunter.progress.level, 15, 'reinvite captures the latest independent level');
assert.equal(reloaded.memberSnapshots.hunter.progress.equipment.weapon.id, 'forest-bow', 'reinvite captures the latest equipment');
assert.equal(reloaded.memberSnapshots.hunter.progress.skillLevels['hunter:power-shot'], 6, 'reinvite captures the latest skills');

const legacy = { activeMemberIds: ['leader', 'hunter'] };
const migrated = party.normalizeParty(legacy, { slots: grownSlots, mainSlotIndex: 0 });
assert.equal(migrated.memberSnapshots.hunter.progress.level, 15, 'a legacy id-only party receives one initial snapshot');
grownSlots[1].progress.level = 18;
const migratedAgain = party.normalizeParty(migrated, { slots: grownSlots, mainSlotIndex: 0 });
assert.equal(migratedAgain.memberSnapshots.hunter.progress.level, 15, 'a migrated snapshot is not refreshed on later loads');

assert.match(script, /PartyPolicy\.addActiveMember\(party, memberId, \{ slots: getCharacterSlots\(\) \}\)/, 'live invites capture the current character slot');
assert.match(script, /PartyPolicy\.createSlotFromInvitationSnapshot\(snapshot, liveSlot\?\.progress\?\.partyMemberState, progress\)/, 'battle construction uses the invitation snapshot');
assert.match(script, /const progress = getProgress\(\)[\s\S]*progress\.xp \+= earnedXp[\s\S]*progress\.gold \+= earnedGold/, 'leader rewards remain on the active progress');
assert.doesNotMatch(script.match(/function rewardVictory\(index\) \{[\s\S]*?\n\}/)?.[0] || '', /memberSnapshots|partyMembers.*xp|partyMembers.*inventory/, 'leader rewards do not write into teammate snapshots');

console.log('party-invitation-snapshot: assertions passed');
