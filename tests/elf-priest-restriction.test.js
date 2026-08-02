const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /raceId === 'elf' && jobId === 'priest'/, 'night elf priest is configured as hidden');
assert.match(script, /classes\.filter\(\(job\) => !isJobHiddenForRace\(selection\.race, job\.id\)\)/, 'hidden jobs are omitted from creation UI');
assert.match(script, /if \(!canCreateRaceJob\(selection\.race, selection\.job\)\) selection\.job = 'warrior'/, 'switching to night elf clears an existing priest selection');
assert.match(script, /if \(canCreateRaceJob\(selection\.race, selection\.job\)\) return;/, 'final creation submission rejects invalid race and job combinations');

console.log('elf-priest-restriction: assertions passed');
