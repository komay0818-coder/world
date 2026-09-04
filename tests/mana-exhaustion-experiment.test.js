const assert = require('node:assert/strict');
const { createExperiment } = require('./simulations/mana-exhaustion-experiment');
for (const enabled of [true, false]) {
  const e = createExperiment(enabled), p = { job: 'mage', hp: 100, resource: 15, resourceMax: 100 };
  e.initialize(p); e.update(p, .05);
  assert.equal(p.manaExhausted, enabled);
  p.resource = 44; e.update(p, .05); assert.equal(p.manaExhausted, enabled);
  p.resource = 45; e.update(p, .05); assert.equal(p.manaExhausted, false);
  p.hp = -500; assert.equal(p.hp, 1); assert.equal(p.preventedDeaths, 1);
}
for (const job of ['warrior', 'assassin', 'hunter']) {
  const e = createExperiment(true), p = { job, hp: 100, resource: 0, resourceMax: 100 };
  e.initialize(p); e.update(p, 1); assert.equal(p.manaExhausted, false);
}
console.log('Mana exhaustion experiment boundary checks passed');
const { makePlayer, makeEnemy, POOL, cast, basic } = require('./simulations/chapter-three-31-v1-party-simulation');
for (const enabled of [true, false]) {
  const p = makePlayer('mage', 'B', 0, 0, 1, .02, true), e = createExperiment(enabled);
  e.initialize(p); p.resource = p.resourceMax * .15; e.update(p, .05);
  const enemies = POOL.map((t, i) => makeEnemy(t, 0, i));
  assert.equal(cast(p, [p], enemies, 0, () => .5), !enabled);
  p.globalAt = 0;
  basic(p, enemies, 0, () => .5);
  assert.ok(Math.abs(p.basicAt - (enabled ? 1.25 : 1) / p.speed) < 1e-9);
}
console.log('Low-MP cast gate and actual basic interval checks passed');
const result = require('./simulations/results/chapter-three-31-mana-comparison.json');
assert.equal(result.totalRuns, 1000);
assert.equal(result.cells.length, 10);
for (let i = 0; i < result.cells.length; i += 2) {
  const a = result.cells[i], b = result.cells[i + 1];
  assert.equal(a.rows.length, 100); assert.equal(b.rows.length, 100);
  assert.deepEqual(a.rows.map(r => r.seed), b.rows.map(r => r.seed));
  // This baseline never enters exhaustion: paired raw outcomes should be identical.
  assert.deepEqual(a.rows, b.rows);
  for (const row of a.rows) {
    assert.equal(row.seconds, 600); assert.equal(row.alive, true); assert.ok(row.hp >= 1);
    assert.equal(row.exhaustionEntries, 0);
    for (const value of Object.values(row)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  }
}
console.log('Saved 1000-run paired results validated');
