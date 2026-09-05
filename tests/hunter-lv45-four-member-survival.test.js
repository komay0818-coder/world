'use strict';

const assert = require('node:assert/strict');
const result = require('./simulations/results/hunter-lv45-four-member-survival.json');

assert.equal(result.metadata.runs, 1000);
assert.equal(result.metadata.noFormalPolicyChanges, true);
assert.equal(result.metadata.hunterDpsCalibration.differencePercent, -2.7);

const marksman = result.cells.normalMarksman;
const beastmaster = result.cells.normalBeastmaster;
assert.equal(marksman.hunterDeathRatePercent, 0);
assert.equal(beastmaster.hunterDeathRatePercent, 0);
assert.equal(marksman.hunterSurvivalRateByKills['5000'], 100);
assert.equal(beastmaster.hunterSurvivalRateByKills['5000'], 100);
assert.ok(beastmaster.averagePriestHealsOnHunter < marksman.averagePriestHealsOnHunter);
assert.ok(beastmaster.beastmaster.averageGuardAvoidedDamage > 0);
assert.ok(beastmaster.beastmaster.averageAttacksPreventedByStun > 0);

const groupTotal = Object.values(beastmaster.beastmaster.petAliveTimePercent).reduce((total, value) => total + value, 0);
assert.ok(Math.abs(groupTotal - 100) < .01);
assert.equal(result.cells.noHealingMarksman.hunterDeathRatePercent, 100);
assert.equal(result.cells.noHealingBeastmaster.hunterDeathRatePercent, 100);
assert.ok(result.cells.noHealingBeastmaster.averageHunterFirstDeathSeconds > result.cells.noHealingMarksman.averageHunterFirstDeathSeconds);

console.log('hunter-lv45-four-member-survival: result contract passed');

