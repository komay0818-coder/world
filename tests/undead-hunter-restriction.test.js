const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /raceId === 'undead' && jobId === 'hunter'/, 'undead hunter is configured as unavailable');
assert.match(script, /isJobUnavailableForRace\(selection\.race, job\.id\)/, 'undead hunter is disabled in creation UI');
assert.match(script, /不死族無法創立獵人職業。/, 'undead hunter has the correct restriction message');
assert.match(script, /if \(!canCreateRaceJob\(selection\.race, selection\.job\)\) selection\.job = 'warrior'/, 'switching to undead clears an existing hunter selection');
assert.match(script, /if \(canCreateRaceJob\(selection\.race, selection\.job\)\) return;/, 'final creation submission independently rejects undead hunter');

console.log('undead-hunter-restriction: assertions passed');
