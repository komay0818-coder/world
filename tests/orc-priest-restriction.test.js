const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /raceId === 'orc' && jobId === 'priest'/, 'orc priest is configured as unavailable');
assert.match(script, /isJobUnavailableForRace\(selection\.race, job\.id\)/, 'orc priest is disabled in creation UI');
assert.match(script, /if \(!canCreateRaceJob\(selection\.race, selection\.job\)\) selection\.job = 'warrior'/, 'switching to orc clears an existing priest selection');
assert.match(script, /if \(canCreateRaceJob\(selection\.race, selection\.job\)\) return;/, 'final creation submission independently rejects orc priest');

console.log('orc-priest-restriction: assertions passed');
