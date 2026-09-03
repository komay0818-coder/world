const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const script = path.join(__dirname, 'simulations/chapter-three-31-v1-party-simulation.js');
const run = (...args) => JSON.parse(execFileSync(process.execPath, [script, '2', ...args], { encoding: 'utf8' }));
const result = run('--chapter-32-elite-loop');
assert.deepEqual(result, run('--chapter-32-elite-loop'), 'seeded loop is reproducible');
assert.equal(result.cells.length, 8);
assert.equal(result.respawnSeconds, 2);
assert.equal(result.initialSlots, 5);
assert.equal(result.durationSeconds, 600);
assert.equal(result.probabilitiesApplyToInitialSpawns, true);
assert.equal(result.stage.penalty, .072);
assert.deepEqual([result.elite.hp, result.elite.attack, result.elite.defense, result.elite.speed, result.elite.evasion, result.elite.parry, result.elite.dr, result.elite.skillMultiplier, result.elite.skillCooldown], [3350, 135, 115, .82, 3, 20, 24, 1.5, 10]);
const legacy = run('--chapter-32-suppression-curve', '--gear=1', '--stages=6', '--curve-summary');
for (const cell of result.cells) {
  assert.equal(cell.runs, 2);
  assert.ok(cell.averageRunSeconds > 0 && cell.averageRunSeconds <= 600);
  assert.ok(cell.totalSpawns > 10, 'normal replenishment continues after opening five');
  assert.ok(cell.totalEliteSpawns <= cell.totalSpawns);
  assert.ok(cell.elitePresenceTimeShare >= 0 && cell.elitePresenceTimeShare <= 1.001);
  assert.ok(cell.environmentDamagePerMinute <= 4 * 7.2 * 60 + .01);
  assert.equal(cell.eliteSpawnsPerRun, cell.totalEliteSpawns / cell.runs);
  if (cell.frequency === 'E0') {
    const old = legacy.cells.find(c => c.party === cell.party);
    for (const key of ['fullPartySurvivalRate', 'survivalRate', 'survivorPartyHpPercent', 'teamDps', 'killsPerMinute', 'priestHealingPerMinute', 'teamKillHealingPerMinute']) {
      assert.ok(Math.abs(cell[key] - old[key]) < 1e-8, `E0 preserves ${key}`);
    }
    assert.deepEqual(cell.deathRates, old.deathRates);
    assert.equal(cell.totalEliteSpawns, 0);
    assert.equal(cell.eliteDirectDamagePerMinute, 0);
    assert.equal(cell.environmentDamagePerKillDeltaVsE0, 0);
  } else {
    assert.ok(cell.totalEliteSpawns > 0);
    assert.ok(cell.maxConcurrentElites > 0 && cell.maxConcurrentElites <= 5);
  }
}
console.log('Chapter 3-2 elite loop checks passed');
