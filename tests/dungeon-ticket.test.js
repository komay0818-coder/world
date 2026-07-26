const assert = require('assert');
const cycle = require('../dungeon-ticket.js');

const finalTicket = cycle.resolveCompletion({
  ticketCount: 1,
  dungeonId: 'goblin-camp',
  returnMapId: 'wolf-den'
});
assert.deepEqual(finalTicket, {
  consumed: 1,
  ticketsLeft: 0,
  restartDungeon: false,
  nextMapId: 'wolf-den',
  nextAdmission: false,
  delayMs: 5000
}, 'the last ticket is consumed and returns to the original map after five seconds');

const repeatRun = cycle.resolveCompletion({
  ticketCount: 3,
  dungeonId: 'goblin-camp',
  returnMapId: 'boar-woods'
});
assert.deepEqual(repeatRun, {
  consumed: 1,
  ticketsLeft: 2,
  restartDungeon: true,
  nextMapId: 'goblin-camp',
  nextAdmission: true,
  delayMs: 1500
}, 'remaining tickets automatically start another dungeon run');

const missingTicket = cycle.resolveCompletion({
  ticketCount: 0,
  dungeonId: 'goblin-camp',
  returnMapId: 'plains-entrance'
});
assert.equal(missingTicket.consumed, 0, 'ticket count never becomes negative');
assert.equal(missingTicket.nextMapId, 'plains-entrance', 'missing tickets safely return to the original map');

assert.equal(cycle.shouldDropTicket(.49), true, 'a roll below 50% drops the goblin camp map');
assert.equal(cycle.shouldDropTicket(.50), false, 'a roll at 50% does not drop the goblin camp map');
assert.equal(cycle.shouldDropTicket(.99), false, 'a high roll does not drop the goblin camp map');

assert.deepEqual(cycle.resolveGoblinCampWaveClear({ wave: 3, randomValue: 0 }), {
  horn: false,
  escaped: false,
  continueDungeon: true,
  nextWave: 4
}, 'the first three waves always continue without a horn event');
assert.deepEqual(cycle.resolveGoblinCampWaveClear({ wave: 4, randomValue: .49 }), {
  horn: true,
  escaped: true,
  continueDungeon: false,
  nextWave: null
}, 'wave four can end when the goblins escape');
assert.deepEqual(cycle.resolveGoblinCampWaveClear({ wave: 5, randomValue: .50 }), {
  horn: true,
  escaped: false,
  continueDungeon: true,
  nextWave: 6
}, 'a roll at 50% continues to the next wave');
assert.deepEqual(cycle.resolveGoblinCampWaveClear({ wave: 6, randomValue: .99 }), {
  horn: true,
  escaped: false,
  continueDungeon: true,
  nextWave: 7
}, 'wave six can continue to the final wave');
assert.deepEqual(cycle.resolveGoblinCampWaveClear({ wave: 7, randomValue: 0 }), {
  horn: false,
  escaped: false,
  continueDungeon: false,
  nextWave: null
}, 'wave seven always completes the dungeon');

assert.deepEqual(cycle.getGoblinCampWaveTypes(1), ['goblinWarrior', 'goblinSlinger', 'goblinScout', 'goblinScout'], 'wave one uses one warrior, one slinger and two scouts');
assert.deepEqual(cycle.getGoblinCampWaveTypes(2), ['goblinWarrior', 'goblinSlinger', 'goblinSlinger', 'goblinScout'], 'wave two uses one warrior, two slingers and one scout');
assert.deepEqual(cycle.getGoblinCampWaveTypes(3), ['goblinWarrior', 'goblinWarrior', 'goblinShaman', 'goblinShaman'], 'wave three uses two warriors and two elite shamans');
assert.deepEqual(cycle.getGoblinCampWaveTypes(4), ['goblinGuard', 'goblinWarrior', 'goblinShaman', 'goblinShaman'], 'wave four uses one elite guard, one warrior and two elite shamans');
assert.deepEqual(cycle.getGoblinCampWaveTypes(5), ['goblinCaptain', 'goblinGuard', 'goblinGuard', 'goblinShaman'], 'wave five uses one captain boss, two elite guards and one elite shaman');
assert.deepEqual(cycle.getGoblinCampWaveTypes(6), ['goblinGuard', 'goblinGuard', 'goblinShaman', 'goblinTreasureChest'], 'wave six includes the rare goblin treasure chest');
assert.deepEqual(cycle.getGoblinCampWaveTypes(7), ['goblinHighChief', 'goblinGuard', 'goblinShaman'], 'wave seven uses the high chief boss, one elite guard and one elite shaman');
assert.deepEqual(cycle.getGoblinCampWaveTypes(8), [], 'waves beyond seven have no monster distribution');

console.log('dungeon-ticket: 61 assertions passed');
