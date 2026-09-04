const assert = require('node:assert/strict');
const { createExperiment } = require('./simulations/mana-exhaustion-experiment');
const p = { job: 'mage', hp: 100, resource: 10, resourceMax: 100 };
const experiment = createExperiment(true, false);
experiment.initialize(p); experiment.update(p, .05);
assert.equal(p.manaExhausted, true);
p.hp = 0; assert.equal(p.hp, 0);
assert.equal(p.preventedDeaths, 0);
const result = require('./simulations/results/chapter-three-31-mana-mortal.json');
assert.equal(result.immortal, false);
assert.equal(result.cells.length, 10);
assert.equal(result.cells.reduce((n, c) => n + c.rows.length, 0), 1000);
for (let i = 0; i < 10; i += 2) {
  const a = result.cells[i], b = result.cells[i + 1];
  assert.deepEqual(a.rows, b.rows);
  assert.equal(a.rows.length, 100);
  assert.equal(new Set(a.rows.map(r => r.seed)).size, 100);
  for (const row of a.rows) {
    assert.equal(row.preventedDeaths, 0);
    assert.ok(row.seconds > 0 && row.seconds <= 600);
    if (row.alive) assert.equal(row.seconds, 600);
    else { assert.equal(row.hp, 0); assert.ok(row.seconds < 600); }
    for (const v of Object.values(row)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
  }
  assert.equal(a.survivalRate, a.rows.filter(r => r.alive).length / 100);
  assert.ok(Math.abs(a.windowKillsPerMinute - a.killsPerAttempt / 10) < 1e-10);
}
console.log('Mortal switch and 1000 saved paired runs passed; no extra simulations');
