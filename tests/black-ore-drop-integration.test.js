const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const crafting = fs.readFileSync(path.join(root, 'crafting-policy.js'), 'utf8');

assert.match(script, /grantMaterialDrops\(progress, currentMap\.id, enemy\)/, 'reward settlement passes the defeated monster to the material policy');
assert.match(script, /VillageUpgradePolicy\.grantMapDrops\(progress, currentMap\.id\)/, 'reward settlement also grants map-based building black ore');
assert.doesNotMatch(crafting, /blackOre: Object\.freeze/, 'black ore has one canonical material definition in the drop policy');
assert.match(index, /chapter-one-material-drop-policy\.js\?v=20260815-material-artwork-v1/, 'the material policy cache key includes the current artwork');
assert.match(index, /world\/9b7e2d8e1c96c353899c69c79e7c26ad916a302c\/script\.js/, 'the integration script uses the current immutable build');
assert.match(index, /VER\. 0\.6\.34/, 'the current game version includes skill combat integration');

console.log('black-ore-drop-integration: assertions passed');
