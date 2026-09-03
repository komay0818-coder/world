// Rule-level checks only: no extra combat simulations beyond the requested 600 runs.
const assert = require('node:assert/strict');
const rules = require('./simulations/chapter-three-33-rules.js');
const living = template => ({ ...template, currentHp: template.hp, maxHp: template.hp });
const boss = living(rules.boss);
boss.currentHp = boss.maxHp / 2;
rules.updateAllOut(boss, 20);
assert.equal(boss.allOutTriggered, undefined);
boss.currentHp--;
rules.updateAllOut(boss, 21);
rules.updateAllOut(boss, 22);
assert.equal(boss.allOutTriggerCount, 1);
assert.equal(boss.allOutAt, 21);
assert.equal(rules.attackMultiplier(boss, 22), 1.12);
assert.equal(rules.speedMultiplier(boss), 1.10);
assert.equal(rules.defenseMultiplier(boss), .90);
const deadBoss = { ...living(rules.boss), currentHp: 0 };
rules.updateAllOut(deadBoss, 3);
assert.equal(deadBoss.allOutTriggered, undefined);
const berserker = living(rules.normals[0]);
berserker.currentHp = berserker.maxHp * .35;
assert.equal(rules.speedMultiplier(berserker), 1);
berserker.currentHp--;
assert.equal(rules.speedMultiplier(berserker), 1.15);
const normal = living(rules.normals[1]), elite = living(rules.elite), elite2 = living(rules.elite);
const enemies = [normal, elite, elite2];
assert.equal(rules.frontlineMultiplier(normal, enemies), 1.06);
assert.equal(rules.frontlineMultiplier(elite, enemies), 1);
rules.castWarDrum(enemies, 12);
rules.castWarDrum(enemies, 14);
assert.equal(normal.warDrumUntil, 19);
assert.equal(rules.attackMultiplier(normal, 18), 1.08);
assert.equal(rules.attackMultiplier(elite, 18), 1.08);
assert.equal(rules.attackMultiplier(normal, 19), 1);
assert.equal(rules.attackMultiplier(living(rules.normals[1]), 15), 1, 'new spawn does not inherit earlier blessing');
elite.currentHp = 0;
assert.equal(rules.frontlineMultiplier(normal, enemies), 1.06);
elite2.currentHp = 0;
assert.equal(rules.frontlineMultiplier(normal, enemies), 1, 'aura immediately ends on last centurion death');
const hunter = living(rules.normals[2]);
const target = { alive: true, hp: 100 }, other = { alive: true, hp: 100 };
for (let i = 0; i < 3; i++) {
  assert.equal(rules.hunterBasicBonus(hunter, target, false), 1);
  rules.recordHunterHit(hunter, target, false);
}
assert.equal(rules.hunterBasicBonus(hunter, target, true), 1);
rules.recordHunterHit(hunter, target, true);
assert.equal(rules.hunterBasicBonus(hunter, target, false), 1.2);
assert.equal(rules.hunterBasicBonus(hunter, target, false), 1.2, 'miss does not consume accumulated successful hits');
rules.recordHunterHit(hunter, target, false);
assert.equal(hunter.focusHits, 0);
rules.recordHunterHit(hunter, target, false);
rules.hunterBasicBonus(hunter, other, false);
assert.equal(hunter.focusHits, 0);
other.hp = 0;
rules.recordHunterHit(hunter, other, false);
assert.equal(hunter.focusTarget, null);
console.log('Chapter 3-3 rule checks passed; no additional simulations');
const result = require('./simulations/results/chapter-three-33-complete-v1.json');
assert.equal(result.totalRuns, 600);
assert.equal(result.cells.reduce((n, cell) => n + cell.runs, 0), 600);
assert.equal(result.cells.length, 6);
assert.deepEqual(result.templates, { normals: rules.normals, elite: rules.elite, boss: rules.boss });
assert.equal(result.eliteChance, .05);
for (const party of ['A', 'B']) {
  assert.deepEqual(result.cells.filter(c => c.party === party).map(c => [c.mode, c.stage]), [['loop', '8/20'], ['loop', '12/20'], ['boss', '12/20']]);
}
for (const cell of result.cells) {
  assert.equal(cell.runs, 100);
  if (cell.mode === 'loop') {
    assert.ok(Math.abs(Object.values(cell.enemyDamageShares).reduce((a, b) => a + b, 0) - 1) < 1e-10);
    assert.ok(cell.fullPartySurvivalRate <= cell.survivalRate);
    assert.ok(cell.frontlineCoverage <= cell.centurionPresence);
    assert.ok(cell.overlapCoverage <= Math.min(cell.warDrumCoverage, cell.frontlineCoverage));
    assert.ok(cell.observedEliteRate > .04 && cell.observedEliteRate < .06);
  } else {
    assert.equal(cell.killRate + cell.wipeRate + cell.timeoutRate, 1);
    assert.equal(cell.maxKills, 1);
    assert.equal(cell.maxEnemies, 1);
    assert.equal(cell.phaseEntryRate, 1);
    assert.equal(cell.maxPhaseTriggers, 1);
    assert.equal(cell.phaseStats.attack, 190.4);
    assert.ok(Math.abs(cell.phaseStats.speed - .88) < 1e-10);
    assert.equal(cell.phaseStats.defense, 126);
    assert.ok(Math.abs(cell.phaseEntrySeconds + cell.phaseDurationSeconds - cell.averageKillSeconds) < 1e-8);
    assert.ok(cell.phaseDamagePerRun > 0 && cell.phaseDamagePerRun <= cell.bossDamagePerRun);
  }
}
console.log('Recorded 600-run result checks passed');
