const assert = require('node:assert/strict');
const policy = require('../party-policy.js');

assert.equal(policy.getUnlockedPartySlots(9), 1, 'Lv9 only unlocks the main character slot');
assert.equal(policy.getUnlockedPartySlots(10), 2, 'Lv10 unlocks the second party slot');
assert.equal(policy.getUnlockedPartySlots(20), 3, 'Lv20 unlocks the third party slot');
assert.equal(policy.getUnlockedPartySlots(30), 4, 'Lv30 unlocks the fourth party slot');
assert.deepEqual([1, 2, 3].map(policy.getPartySlotUnlockLevel), [10, 20, 30], 'locked slots expose the requested unlock levels');

const slots = [
  { character: { name: '主角', race: 'human', job: 'warrior' }, progress: { level: 9, equipment: {} } },
  { character: { name: '隊員', race: 'elf', job: 'hunter' }, progress: { level: 7, equipment: {} } }
];
const levelNineParty = policy.normalizeParty(null, { slots, mainSlotIndex: 0 });
assert.equal(levelNineParty.activeMemberIds.length, 1, 'legacy saves create a one-person Lv9 party');
assert.equal(levelNineParty.activeMemberIds[0], slots[0].character.id, 'the main character is always first');

slots[0].progress.level = 10;
const levelTenParty = policy.normalizeParty({
  activeMemberIds: [slots[0].character.id, slots[1].character.id]
}, { slots, mainSlotIndex: 0 });
assert.deepEqual(levelTenParty.activeMemberIds, [slots[0].character.id, slots[1].character.id], 'Lv10 preserves a configured second member');

const members = [
  { id: 'dead', alive: false, currentHp: 0 },
  { id: 'first', alive: true, currentHp: 10 },
  { id: 'second', alive: true, currentHp: 20 }
];
assert.equal(policy.chooseRandomAliveMember(members, () => 0).id, 'first', 'random targeting skips dead members');
assert.equal(policy.chooseRandomAliveMember(members, () => .99).id, 'second', 'random targeting can select another living member');
assert.equal(policy.chooseRandomAliveMember([members[0], members[2]], () => 0).id, 'second', 'a sole survivor is always selected');
assert.equal(policy.isPartyDefeated(members), false, 'one death does not defeat the party');
assert.equal(policy.isPartyDefeated([{ alive: false, currentHp: 0 }]), true, 'all members dead defeats the party');
assert.equal(policy.getFrontAliveEnemyIndex([0, 20, 10], [1, 30, 20]), 2, 'members target the oldest living front enemy');

console.log('party-policy: assertions passed');
