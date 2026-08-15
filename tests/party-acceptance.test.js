const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const party = require('../party-policy.js');
const dungeon = require('../dungeon-ticket.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const results = [];
function verify(id, name, test) {
  test();
  results.push({ id, name, passed: true });
}

function makeSlots(level = 30) {
  return ['warrior', 'assassin', 'hunter', 'mage'].map((job, index) => ({
    character: { id: `member-${index + 1}`, name: job, job, race: 'human' },
    progress: { level: index === 0 ? level : 20 }
  }));
}

verify(1, 'slot unlock boundaries', () => {
  assert.deepEqual([9, 10, 19, 20, 29, 30].map(party.getUnlockedPartySlots), [1, 2, 2, 3, 3, 4]);
});

verify(2, 'main member fixed first', () => {
  const normalized = party.normalizeParty({ activeMemberIds: ['member-2', 'member-1'] }, { slots: makeSlots(), mainSlotIndex: 0 });
  assert.equal(normalized.activeMemberIds[0], 'member-1');
  assert.equal(party.removeActiveMember(normalized, 'member-1'), false);
});

verify(3, 'duplicate member rejected', () => {
  const normalized = party.normalizeParty(null, { slots: makeSlots(), mainSlotIndex: 0 });
  assert.equal(party.addActiveMember(normalized, 'member-2'), true);
  assert.equal(party.addActiveMember(normalized, 'member-2'), false);
});

verify(4, 'add/remove persists and rebuilds runtime UI', () => {
  assert.match(script, /PartyPolicy\.addActiveMember[\s\S]*saveProgress\(progress\)[\s\S]*renderParty\(\)[\s\S]*rebuildBattlePartyMembers/);
  assert.match(script, /PartyPolicy\.removeActiveMember[\s\S]*saveProgress\(progress\)[\s\S]*renderParty\(\)[\s\S]*rebuildBattlePartyMembers/);
});

verify(5, 'independent normal attack timers', () => {
  const first = { alive: true, currentHp: 1, nextAttackAt: 100, stunnedUntil: 0 };
  const second = { alive: true, currentHp: 1, nextAttackAt: 200, stunnedUntil: 0 };
  assert.equal(party.canMemberAttack(first, 100), true);
  assert.equal(party.canMemberAttack(second, 100), false);
  party.scheduleNextAttack(first, 100, 2);
  assert.equal(second.nextAttackAt, 200);
});

verify(6, 'independent skill cooldowns', () => {
  const records = makeSlots().slice(0, 2).map(party.createMemberRecord);
  records[0].skillCooldowns.fireball = 5000;
  assert.equal(records[1].skillCooldowns.fireball, undefined);
  assert.match(script, /member\.skillCooldowns\[skill\.id\] = now \+ \(skillEffect\.cooldown \|\| skill\.cooldown\)/);
});

verify(7, 'independent class resources', () => {
  const records = makeSlots().map(party.createMemberRecord);
  assert.deepEqual(records.map((member) => member.resource.type), ['rage', 'energy', 'arrows', 'mana']);
  records[0].resource.current = 80;
  assert.ok(records.slice(1).every((member) => member.resource.current === 0));
  assert.match(script, /updatePartyMemberResource\(member, now\)/);
});

verify(8, 'random living-member monster targeting', () => {
  const members = [{ id: 'a', alive: true, currentHp: 1 }, { id: 'b', alive: true, currentHp: 1 }];
  assert.equal(party.chooseRandomAliveMember(members, () => 0).id, 'a');
  assert.equal(party.chooseRandomAliveMember(members, () => .99).id, 'b');
});

verify(9, 'dead members cannot act or be targeted', () => {
  const dead = { id: 'dead', alive: false, currentHp: 0, nextAttackAt: 0 };
  const alive = { id: 'alive', alive: true, currentHp: 1 };
  assert.equal(party.canMemberAttack(dead, 9999), false);
  assert.equal(party.chooseRandomAliveMember([dead, alive], () => 0).id, 'alive');
  assert.match(script, /if \(!member\?\.alive[\s\S]*return false/);
});

verify(10, 'defeat only when whole party is dead', () => {
  assert.equal(party.isPartyDefeated([{ alive: false, currentHp: 0 }, { alive: true, currentHp: 1 }]), false);
  assert.equal(party.isPartyDefeated([{ alive: false, currentHp: 0 }, { alive: false, currentHp: 0 }]), true);
});

verify(11, 'single reward per enemy spawn', () => {
  const keys = new Set();
  assert.equal(party.claimEnemyReward(keys, 0, 10).claimed, true);
  assert.equal(party.claimEnemyReward(keys, 0, 10).claimed, false);
  assert.equal(party.claimEnemyReward(keys, 0, 11).claimed, true);
});

verify(12, 'rear replacement and target reselection', () => {
  assert.equal(party.getFrontAliveEnemyIndex([0, 5, 5], [1, 3, 2]), 2);
  assert.match(script, /processEnemyRespawns\(\)[\s\S]*processPartyMemberAttacks/);
});

verify(13, 'party configuration saved and restored', () => {
  assert.match(script, /progress\.party = PartyPolicy\.normalizeParty/);
  assert.match(script, /localStorage\.setItem\('stardust-progress', JSON\.stringify\(progress\)\)/);
  const slots = makeSlots();
  const normalized = party.normalizeParty(
    { activeMemberIds: ['member-1', 'member-2', 'member-3', 'member-4'] },
    { slots, mainSlotIndex: 0 }
  );
  const restored = JSON.parse(JSON.stringify({ party: normalized }));
  assert.deepEqual(
    party.normalizeParty(restored.party, { slots, mainSlotIndex: 0 }),
    normalized
  );
});

verify(14, 'legacy save creates solo party', () => {
  const slots = makeSlots(9).slice(0, 1);
  assert.deepEqual(party.normalizeParty(undefined, { slots, mainSlotIndex: 0 }).activeMemberIds, ['member-1']);
});

verify(15, 'corrupt party data repaired', () => {
  const slots = makeSlots();
  slots[1].character.id = slots[0].character.id;
  const normalized = party.normalizeParty({ activeMemberIds: ['bad', 'member-1', 'member-1', 'member-3', 'member-4', 'extra'] }, { slots, mainSlotIndex: 0 });
  assert.equal(new Set(slots.map((slot) => slot.character.id)).size, 4);
  assert.equal(new Set(normalized.activeMemberIds).size, normalized.activeMemberIds.length);
  assert.ok(normalized.activeMemberIds.length <= 4);
});

verify(16, 'normal, dungeon, boss and return flows', () => {
  assert.match(script, /isDungeon \? createDungeonWaveTypes/);
  assert.match(script, /enemy\.isBoss \? currentMap\.bossXp/);
  assert.deepEqual(dungeon.resolveCompletion({ ticketCount: 1, dungeonId: 'goblin-camp', returnMapId: 'wolf-den' }).nextMapId, 'wolf-den');
  assert.equal(dungeon.resolveGoblinCampWaveClear({ wave: 7, randomValue: 0 }).continueDungeon, false);
});

verify(17, 'map changes replace loops and invalidate stale transitions', () => {
  assert.match(script, /clearInterval\(battleTimer\)[\s\S]*clearInterval\(skillTimer\)[\s\S]*clearInterval\(enemyAttackTimer\)/);
  assert.match(script, /battle\.sessionId !== transitionSessionId/);
  assert.match(script, /battle\.sessionId !== completedSessionId/);
});

assert.equal(results.length, 17);
console.log(`party-acceptance: ${results.length}/17 scenarios passed`);
