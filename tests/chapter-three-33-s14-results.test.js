// Validate the recorded 800-run result without launching any extra simulations.
const assert = require('node:assert/strict');
const result = require('./simulations/results/chapter-three-33-s14-v1.json');
const baseline = require('./simulations/results/chapter-three-32-elite-loop-v1.json');
assert.equal(result.runs, 100);
assert.equal(result.durationSeconds, 600);
assert.equal(result.totalSuppression, 14);
assert.equal(result.totalFacilities, 20);
assert.equal(result.respawnSeconds, 2);
assert.equal(result.eliteChance, 0);
assert.equal(result.boss, false);
assert.deepEqual(result.stagePoints, [0, 4, 8, 12]);
assert.equal(result.cells.length, 8);
assert.deepEqual(result.monsterPool.map(m => [m.id, m.hp, m.attack, m.defense]), [['hyena', 748, 94, 40], ['scout', 943, 101, 55], ['skull-spear', 990, 109, 58], ['skull-warrior', 1217, 92, 90]]);
for (const party of ['A', 'B']) {
  const cells = result.cells.filter(c => c.party === party);
  assert.deepEqual(cells.map(c => c.stage), ['0/20', '4/20', '8/20', '12/20']);
  for (const cell of cells) {
    const cleared = Number(cell.stage.split('/')[0]);
    const remaining = 14 * (1 - Math.min(1, cleared / 20));
    assert.equal(cell.killHealAffixCount, 1);
    assert.ok(Math.abs(cell.suppression.drain - remaining) < 1e-10);
    assert.ok(Math.abs(cell.suppression.damagePenalty * 100 - remaining) < 1e-10);
    assert.equal(cell.suppression.damagePenalty, cell.suppression.defensePenalty);
    assert.ok(cell.fullPartySurvivalRate >= 0 && cell.fullPartySurvivalRate <= cell.survivalRate && cell.survivalRate <= 1);
    if (!cell.survivalRate) assert.equal(cell.survivorPartyHpPercent, null);
    else assert.ok(cell.survivorPartyHpPercent >= 0 && cell.survivorPartyHpPercent <= 1);
    if (cell.survivalRate === 1) assert.equal(cell.averageWipeSeconds, null);
    else assert.ok(cell.averageWipeSeconds > 0 && cell.averageWipeSeconds <= 600);
  }
  const old = baseline.cells.find(c => c.party === party && c.frequency === 'E0');
  assert.equal(old.runs, 100);
  assert.equal(old.fullPartySurvivalRate, 1);
  assert.ok(cells[2].fullPartySurvivalRate < old.fullPartySurvivalRate);
  assert.equal(cells[3].fullPartySurvivalRate, 1);
}
console.log('S14 recorded-result checks passed; no simulations rerun');
