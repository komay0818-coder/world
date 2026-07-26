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

console.log('dungeon-ticket: 9 assertions passed');
