const assert = require('node:assert/strict');
const r = require('./simulations/chapter-three-36-rules');
const living = t => ({ ...t, currentHp: t.hp, maxHp: t.hp });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const stone = living(r.normals[0]);
for (let i = 0; i < 4; i++) assert.equal(r.shellMultiplier(stone, 10), 1);
assert.equal(r.shellMultiplier(stone, 0), 1);
assert.equal(stone.shellHits36, 4);
assert.equal(r.shellMultiplier(stone, 10), .7);
assert.equal(stone.shellHits36, 0);
const p = { defense: 100 }, ally = { defense: 100 };
r.onSkillHit(r.normals[1], p, 1);
r.onSkillHit(r.normals[1], p, 3);
near(r.playerDefense(p, 7), 92);
assert.equal(r.playerDefense(p, 8), 100);
assert.equal(r.playerDefense(ally, 7), 100);
assert.equal(r.skillMultiplier(r.normals[2], { hp: 35, maxHp: 100 }), 1.5);
assert.equal(r.skillMultiplier(r.normals[2], { hp: 34, maxHp: 100 }), 1.7);
const healer = living(r.normals[3]), guardian = living(r.elite);
guardian.currentHp = guardian.maxHp * .5;
r.afterDamage(guardian, 1);
assert.equal(r.extraDr(guardian, 6), 8);
assert.equal(r.extraDr(guardian, 7), 0);
r.heal(healer, [healer, guardian]);
assert.ok(guardian.currentHp > guardian.maxHp * .5);
guardian.currentHp = guardian.maxHp * .49;
r.afterDamage(guardian, 9);
assert.equal(guardian.barrierCount36, 1);
assert.equal(guardian.barrierRecrossings36, 1);
assert.equal(r.extraDr(guardian, 9), 0);
const injured = { id: 'injured', currentHp: 1, maxHp: 100 }, dead = { currentHp: 0, maxHp: 100 };
assert.equal(r.heal(healer, [healer, guardian, injured, dead]).target, injured);
assert.equal(injured.currentHp, 7);
injured.currentHp = 99;
assert.equal(r.heal(healer, [healer, injured]).actual, 1);
healer.currentHp = 1;
assert.equal(r.heal(healer, [healer, injured, dead]), null);
assert.equal(dead.currentHp, 0);
assert.equal(healer.currentHp, 1);
const b = living(r.boss);
b.currentHp = b.maxHp * .7;
r.afterDamage(b, 0);
assert.equal(b.defenseAt36, undefined);
b.currentHp--;
r.afterDamage(b, 1);
near(b.defense * r.defenseMultiplier(b, 2), 181.5);
assert.equal(b.dr + r.extraDr(b, 2), 36);
assert.equal(r.defenseMultiplier(b, 11), 1);
b.currentHp = b.maxHp * .4;
r.afterDamage(b, 2);
assert.equal(b.rampageAt36, undefined);
b.currentHp--;
r.afterDamage(b, 3);
near(b.attack * r.attackMultiplier(b, 4), 217.8);
near(b.speed * r.speedMultiplier(b, 4), .858);
assert.equal(r.attackMultiplier(b, 13), 1);
b.currentHp = b.maxHp * .2;
r.afterDamage(b, 4);
assert.equal(b.coreAt36, undefined);
b.currentHp--;
r.afterDamage(b, 5);
near(b.defense * r.defenseMultiplier(b, 6), 132);
assert.equal(b.dr + r.extraDr(b, 6), 26);
near(b.attack * r.attackMultiplier(b, 6), 221.76);
near(b.speed * r.speedMultiplier(b, 6), .8736);
b.currentHp = b.maxHp;
r.afterDamage(b, 6);
b.currentHp = 1;
r.afterDamage(b, 7);
assert.deepEqual([b.defenseCount36, b.rampageCount36, b.coreCount36], [1, 1, 1]);
assert.equal(r.pulseTargets([{ alive: false }, ...Array.from({ length: 5 }, () => ({ alive: true }))]).length, 4);
console.log('3-6 pure mechanism checks passed (no additional simulations)');
const result = require('./simulations/results/chapter-three-36-mechanics-v1.json');
assert.equal(result.totalValidRuns, 600);
assert.deepEqual(result.templates, { normals: r.normals, elite: r.elite, boss: r.boss });
assert.equal(result.cells.length, 6);
function finite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}
finite(result);
for (const { summary: s, rawRows } of result.cells) {
  assert.equal(rawRows.length, 100);
  assert.equal(new Set(rawRows.map(row => row.seed)).size, 100);
  for (const row of rawRows) {
    assert.ok(row.time <= (s.mode === 'boss' ? 120 : 600));
    assert.equal(row.players.length, 4);
    for (const p of row.players) assert.ok(p[0] >= 0 && p[0] <= p[1]);
    const m = row.mechanics;
    if (s.mode === 'loop') {
      assert.equal(m.selfHeals, 0);
      assert.equal(m.resurrections, 0);
      assert.equal(Object.values(m.healTargets).reduce((a, b) => a + b, 0), m.healCasts);
      for (const b of m.barriers) { assert.ok(b[2] <= 1); assert.ok(b[3] >= 0 && b[3] <= 6 + 1e-9); }
    } else {
      assert.ok(m.pulseMaxTargets <= 4);
      for (const key of ['defense', 'rampage', 'core']) assert.ok(m[key + 'Count'] <= 1);
      for (const key of ['defense', 'rampage']) assert.ok(m[key + 'Duration'] >= 0 && m[key + 'Duration'] <= 10 + 1e-9);
    }
  }
}
console.log('3-6 saved 600-run integrity checks passed');
