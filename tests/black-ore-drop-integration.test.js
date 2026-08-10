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
assert.match(index, /chapter-one-material-drop-policy\.js\?v=20260806-black-ore-drops-v2/, 'the material policy cache key changes');
assert.match(index, /world\/ee82aa384081c756bc8f336c8a509ee17d0a4f9f\/script\.js/, 'the integration script uses an immutable deployment path');
assert.match(index, /VER\. 0\.4\.76/, 'the game version includes the drop lookup feature');

console.log('black-ore-drop-integration: assertions passed');
