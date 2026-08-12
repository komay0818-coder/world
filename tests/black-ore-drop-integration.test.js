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
assert.match(index, /chapter-one-material-drop-policy\.js\?v=20260813-blackstone-only-v3/, 'the blackstone-only material policy cache key changes');
assert.match(index, /world\/f27dbac9084c4f53184a4bcf2ac6193de551b427\/script\.js/, 'the integration script uses an immutable deployment path');
assert.match(index, /VER\. 0\.6\.3/, 'the game version includes tab-scoped character binding');

console.log('black-ore-drop-integration: assertions passed');
