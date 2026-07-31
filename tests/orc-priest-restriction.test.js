const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(script, /selection\.race === 'orc' && job\.id === 'priest'/, 'orc priest is disabled in creation UI');
assert.match(script, /selection\.race === 'orc' && selection\.job === 'priest'\) selection\.job = 'warrior'/, 'switching to orc clears an existing priest selection');
assert.match(script, /selection\.race === 'orc' && choice\.dataset\.job === 'priest'/, 'orc priest clicks are rejected');
assert.match(script, /selection\.race !== 'orc' \|\| selection\.job !== 'priest'/, 'final creation submission independently rejects orc priest');

console.log('orc-priest-restriction: assertions passed');
