const assert = require('node:assert/strict');
const policy = require('../party-policy.js');

assert.equal(policy.getUnlockedPartySlots(9), 1, 'Lv9 only unlocks the main character slot');
assert.equal(policy.getUnlockedPartySlots(10), 2, 'Lv10 unlocks the second party slot');
assert.equal(policy.getUnlockedPartySlots(19), 2, 'Lv19 keeps two party slots');
assert.equal(policy.getUnlockedPartySlots(20), 3, 'Lv20 unlocks the third party slot');
assert.equal(policy.getUnlockedPartySlots(29), 3, 'Lv29 keeps three party slots');
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

const corruptSlots = [
  { character: { id: 'duplicate', name: 'Main', job: 'warrior' }, progress: { level: 30 } },
  { character: { id: 'duplicate', name: 'Mage', job: 'mage' }, progress: { level: 20 } },
  { character: { id: '', name: 'Priest', job: 'priest' }, progress: { level: 20 } },
  { character: { id: 'hunter', name: 'Hunter', job: 'hunter' }, progress: { level: 20 } }
];
const repaired = policy.normalizeParty({
  activeMemberIds: ['duplicate', 'duplicate', 'missing', 'hunter', 'character-slot-2', 'character-slot-3']
}, { slots: corruptSlots, mainSlotIndex: 0 });
assert.equal(new Set(corruptSlots.map((slot) => slot.character.id)).size, 4, 'duplicate and missing character ids are repaired');
assert.equal(repaired.activeMemberIds[0], 'duplicate', 'corrupt saves still keep the main character first');
assert.equal(repaired.activeMemberIds.length, 4, 'deduplication occurs before the party size limit is applied');
assert.equal(new Set(repaired.activeMemberIds).size, repaired.activeMemberIds.length, 'active party ids are unique');
assert.ok(repaired.activeMemberIds.every((id) => repaired.members.some((member) => member.id === id)), 'unknown ids are removed');

const attackA = { id: 'a', alive: true, currentHp: 10, stunnedUntil: 0, nextAttackAt: 1000 };
const attackB = { id: 'b', alive: true, currentHp: 10, stunnedUntil: 0, nextAttackAt: 2000 };
assert.equal(policy.canMemberAttack(attackA, 1000), true, 'member A attacks on its own timer');
assert.equal(policy.canMemberAttack(attackB, 1000), false, 'member B does not share member A timer');
assert.equal(policy.scheduleNextAttack(attackA, 1000, 2), 1500, 'attack speed schedules an independent next attack');
assert.equal(attackB.nextAttackAt, 2000, 'scheduling member A does not mutate member B');
attackA.alive = false;
attackA.currentHp = 0;
assert.equal(policy.canMemberAttack(attackA, 9999), false, 'dead members never attack even when their timer is ready');

const rewardKeys = new Set();
assert.equal(policy.claimEnemyReward(rewardKeys, 2, 1234).claimed, true, 'the first kill claims rewards');
assert.equal(policy.claimEnemyReward(rewardKeys, 2, 1234).claimed, false, 'the same spawned enemy cannot reward twice');
assert.equal(policy.claimEnemyReward(rewardKeys, 2, 1235).claimed, true, 'a replacement enemy in the same slot can reward once');

const editableParty = {
  activeMemberIds: ['main'],
  unlockedSlots: 2,
  members: [{ id: 'main' }, { id: 'second' }, { id: 'third' }]
};
assert.equal(policy.removeActiveMember(editableParty, 'main'), false, 'the main character cannot be removed');
assert.equal(policy.addActiveMember(editableParty, 'second'), true, 'an available member can be added');
assert.equal(policy.addActiveMember(editableParty, 'second'), false, 'the same member cannot be added twice');
assert.equal(policy.addActiveMember(editableParty, 'third'), false, 'members cannot exceed the unlocked slot count');
assert.equal(policy.removeActiveMember(editableParty, 'second'), true, 'a non-main member can be removed');
assert.deepEqual(editableParty.activeMemberIds, ['main'], 'removal updates the active party immediately');

const independentRecords = [
  policy.createMemberRecord({ character: { id: 'warrior', job: 'warrior' }, progress: { level: 10 } }, 0),
  policy.createMemberRecord({ character: { id: 'assassin', job: 'assassin' }, progress: { level: 10 } }, 1),
  policy.createMemberRecord({ character: { id: 'hunter', job: 'hunter' }, progress: { level: 10 } }, 2),
  policy.createMemberRecord({ character: { id: 'mage', job: 'mage' }, progress: { level: 10 } }, 3),
  policy.createMemberRecord({ character: { id: 'priest', job: 'priest' }, progress: { level: 10 } }, 4)
];
assert.deepEqual(independentRecords.map((member) => member.resource.type), ['rage', 'energy', 'arrows', 'mana', 'mana'], 'each job receives its own resource type');
assert.equal(new Set(independentRecords.map((member) => member.resource)).size, 5, 'each member owns an independent resource object');
assert.equal(new Set(independentRecords.map((member) => member.skillCooldowns)).size, 5, 'each member owns an independent cooldown object');
independentRecords[0].resource.current = 50;
independentRecords[0].skillCooldowns.skill = 999;
assert.ok(independentRecords.slice(1).every((member) => member.resource.current === 0), 'changing rage does not change another resource');
assert.ok(independentRecords.slice(1).every((member) => member.skillCooldowns.skill === undefined), 'changing one cooldown does not change another cooldown');

console.log('party-policy: assertions passed');
