const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const script = path.join(__dirname, 'simulations/chapter-three-31-v1-party-simulation.js');
const run = () => JSON.parse(execFileSync(process.execPath, [script, '10', '--chapter-32-elite-encounter'], { encoding: 'utf8' }));
const result = run();
assert.deepEqual(result, run(), 'paired encounter runs are reproducible');
assert.equal(result.respawn, false);
assert.equal(result.cells.length, 4);
assert.equal(result.elite.hp, 3350);
assert.equal(result.elite.attack, 135);
assert.equal(result.elite.skillMultiplier, 1.5);
assert.equal(result.stage.penalty, .072);
for (const cell of result.cells) {
  assert.equal(cell.runs, 10);
  assert.equal(cell.clearRate, 1);
  assert.equal(cell.minKills, 5);
  assert.equal(cell.maxKills, 5, 'no enemies respawn');
  assert.ok(cell.averageClearSeconds < 600);
  assert.ok(cell.endHpPercent >= 0 && cell.endHpPercent <= 100);
  if (cell.mode === 'Normal') assert.equal(cell.eliteDamage, 0);
  else assert.ok(cell.eliteDamage > 0);
}
console.log('Chapter 3-2 single encounter checks passed');
