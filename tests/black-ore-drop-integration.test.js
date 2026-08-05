const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const crafting = fs.readFileSync(path.join(root, 'crafting-policy.js'), 'utf8');

assert.match(script, /grantMaterialDrops\(progress, currentMap\.id, enemy\)/, 'reward settlement passes the defeated monster to the material policy');
assert.doesNotMatch(crafting, /blackOre: Object\.freeze/, 'black ore has one canonical material definition in the drop policy');
assert.match(index, /chapter-one-material-drop-policy\.js\?v=20260806-black-ore-drops-v2/, 'the material policy cache key changes');
assert.match(index, /script\.js\?v=20260806-black-ore-drops-v125/, 'the integration cache key changes');
assert.match(index, /VER\. 0\.2\.1/, 'the black ore drop fix increments the patch version');

console.log('black-ore-drop-integration: assertions passed');
