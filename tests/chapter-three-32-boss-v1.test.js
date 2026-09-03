const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { warIntentMultiplier } = require('./simulations/chapter-three-32-boss-rules.js');
for (const [time, multiplier] of [[0, 1], [19.999, 1], [20, 1.08], [39.999, 1.08], [40, 1.16], [120, 1.16]]) {
  assert.equal(warIntentMultiplier(time), multiplier, `war intent boundary ${time}`);
}
const script = path.join(__dirname, 'simulations/chapter-three-31-v1-party-simulation.js');
const run = () => JSON.parse(execFileSync(process.execPath, [script, '5', '--chapter-32-boss-v1'], { encoding: 'utf8' }));
const result = run();
assert.deepEqual(result, run());
assert.equal(result.durationSeconds, 120);
assert.equal(result.respawn, false);
assert.equal(result.cells.length, 2);
assert.equal(result.stage.penalty, .072);
assert.deepEqual([result.boss.hp, result.boss.attack, result.boss.defense, result.boss.speed, result.boss.evasion, result.boss.parry, result.boss.dr, result.boss.skillMultiplier, result.boss.skillCooldown], [15500, 162, 132, .82, 3, 18, 26, 1.55, 10]);
for (const cell of result.cells) {
  assert.equal(cell.maxEnemyCount, 1);
  assert.equal(cell.maxKills, 1);
  assert.ok(cell.longestRunSeconds <= 120);
  assert.equal(cell.killRate + cell.wipeRate + cell.timeoutRate, 1);
  assert.equal(Object.values(cell.killTimeDistribution).reduce((a, b) => a + b, 0), 5);
  assert.equal(cell.warIntentIEntryRate, 1);
  assert.equal(cell.warIntentIIEntryRate, 1);
  assert.ok(cell.heavySlashHitsPerRun <= cell.heavySlashCastsPerRun);
  assert.ok(cell.heavySlashDamagePerHit >= cell.heavySlashDamagePerCast);
  assert.equal(cell.fullPartyKillRate, 1);
  assert.deepEqual(Object.keys(cell.warIntentAttacksPerRun), ['1', '1.08', '1.16']);
  assert.ok(cell.warIntentAttacksPerRun['1.16'] > 0);
  assert.ok(Math.abs(Object.values(cell.warIntentDamagePerRun).reduce((a, b) => a + b, 0) - cell.bossDamagePerRun) < 1e-8);
}
console.log('Chapter 3-2 boss V1 checks passed');
