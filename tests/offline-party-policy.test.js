const assert = require('node:assert/strict');
const P = require('../offline-party-policy.js');
const member = (id, isMain, speed = 1) => ({ id, isMain, job: 'warrior', level: 30,
  maxHp: 100, currentHp: 100, alive: true, shield: 0, nextAttackAt: 2000,
  stats: { attack: 10, defense: 0, damageReduction: 0, attackSpeed: speed, hpRegeneration: 0 },
  character: { id, job: 'warrior' }, progress: { equipment: { weapon: { attack: 10 } }, skillLevels: { x: 3 } },
  resourceCurrent: 42, resourceMax: 100, skillCooldowns: { x: 4500 } });
const monster = { id: 'ordinary', maxHp: 100, attack: 0, defense: 0, attackSpeed: 1 };
function snap(members, monsters = [monster], fighting = true) {
  return P.capture({ members, monsters, fighting, mapId: 'test', now: 1000, runId: 'run' });
}
const a = member('main', true), b = member('b', false, 2), c = member('c', false);
const snapshot = snap([a, b, c]);
a.progress.equipment.weapon.attack = 999; a.currentHp = 0;
assert.equal(snapshot.members[0].progress.equipment.weapon.attack, 10);
assert.equal(snapshot.members[0].currentHp, 100);
assert.equal(snapshot.members[0].cooldowns.x, 3500);
assert.equal(snapshot.members[0].resourceCurrent, 42);
assert.equal(P.duration(snapshot, 1000 + P.LIMIT_MS * 2), P.LIMIT_MS);
assert.equal(P.duration(snap([b], [monster], false), 5000), 0);
const simulate = (s, ms, extra = {}) => P.simulate({ snapshot: s, durationMs: ms,
  outgoing: () => 10, incoming: () => 0, ...extra });
for (const size of [1, 2, 3]) {
  const s = snap([member('main', true), member('b', false), member('c', false)].slice(0, size));
  const r = simulate(s, 3000, { trace: true });
  assert.equal(r.members.length, size);
  assert.equal(r.events.filter(e => e.type === 'attack').length, size * 3);
}
const speeds = simulate(snapshot, 3000, { trace: true });
assert.equal(speeds.events.filter(e => e.memberId === 'b' && e.type === 'attack').length, 5);
assert.deepEqual(speeds.events.filter(e => e.at === 1000 && e.type === 'attack').map(e => e.memberId), ['main', 'b', 'c']);
const lethal = simulate(snap([member('main', true), member('b', false)]), 10000,
  { incoming: () => 100, random: () => 0, trace: true });
assert.equal(lethal.died, true); assert.equal(lethal.deathAtMs, 1000);
assert.equal(lethal.members[1].alive, true);
const shielded = member('main', true); shielded.shield = 100;
const shield = simulate(snap([shielded]), 1000, { incoming: () => 80 });
assert.equal(shield.members[0].shield, 20); assert.equal(shield.members[0].currentHp, 100);
const kill = simulate(snap([member('main', true)], [{ ...monster, maxHp: 10, attack: 1000 }]), 1000,
  { incoming: () => 1000 });
assert.equal(kill.defeated, 1); assert.equal(kill.died, false);
const excluded = snap([member('main', true)], [monster, { ...monster, isFacility: true },
  { ...monster, isBoss: true }, { ...monster, isElite: true }]);
assert.equal(excluded.monsters.length, 1);
const dead = member('main', true); dead.alive = false; dead.currentHp = 0;
assert.equal(simulate(snap([dead]), 3000).deathAtMs, 0);
const regen = member('main', true); regen.currentHp = 50; regen.stats.hpRegeneration = 2;
assert.equal(simulate(snap([regen]), 2500).members[0].currentHp, 55);
assert.equal(simulate(snap([member('main', true)], [], true), 5000).defeated, 0);
assert.equal(simulate(snap([member('main', true)]), 3000).complete, false);
assert.equal(snapshot.members[0].currentHp, 100, 'simulation must not mutate persisted snapshot');
console.log('offline-party-policy: assertions passed');
