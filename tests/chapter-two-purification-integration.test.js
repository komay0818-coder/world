const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const lookup = fs.readFileSync(path.join(__dirname, '..', 'drop-lookup-policy.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(script, /BlackForestCorruptionPolicy\.grantMapDrop\(progress, currentMap\.id, enemy\)/);
assert.match(script, /BlackForestCorruptionPolicy\.purify\(progress, purificationButton\.dataset\.attemptPurification\)/);
assert.match(script, /saveProgress\(progress\)/);
assert.match(lookup, /purificationPolicy\?\.MAP_MATERIALS\?\.\[map\.id\]/);
assert.match(lookup, /monster\.isBoss \? 'boss' : monster\.isElite \? 'elite' : 'normal'/);
assert.match(index, /VER\. 0\.6\.22/);
assert.match(index, /world\/2728da1\/drop-lookup-policy\.js/, 'the live lookup policy includes purification, materials, recipes and special equipment sources');

console.log('chapter-two-purification-integration: assertions passed');
