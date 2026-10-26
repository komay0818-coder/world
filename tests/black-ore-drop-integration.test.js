const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const crafting = fs.readFileSync(path.join(root, 'crafting-policy.js'), 'utf8');

assert.match(script, /grantCraftingMaterialDrops\(progress, currentMap, enemy/, 'reward settlement passes the defeated monster to the shared material settlement');
assert.match(script, /VillageUpgradePolicy\.grantMapDrops\(progress, map\.id\)/, 'shared settlement also grants map-based building black ore');
assert.doesNotMatch(crafting, /blackOre: Object\.freeze/, 'black ore has one canonical material definition in the drop policy');
assert.match(index, /chapter-one-material-drop-policy\.js\?v=20260815-material-artwork-v1/, 'the material policy cache key includes the current artwork');
assert.match(index, /script\.js\?v=[a-zA-Z0-9-]+"/, 'the integration script has a nonempty cache version');
assert.match(index, /VER\. 0\.6\.36/, 'the current game version includes elite affixes and compound skill triggers');

console.log('black-ore-drop-integration: assertions passed');
