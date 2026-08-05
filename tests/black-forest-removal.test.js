const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const mapProgressionBlock = script.match(/const mapProgression = \[[\s\S]*?\n\];/)?.[0] || '';
const dungeonDefinitionsBlock = script.match(/const dungeonDefinitions = \{[\s\S]*?\n\};/)?.[0] || '';

assert.doesNotMatch(mapProgressionBlock, /id: 'black-forest'/, 'black forest is not an available map');
assert.doesNotMatch(mapProgressionBlock, /id: 'black-forest-altar'/, 'black forest altar is not an available dungeon');
assert.doesNotMatch(dungeonDefinitionsBlock, /black-forest-altar/, 'the altar is not an active dungeon definition');
assert.doesNotMatch(script, /accountDrops\.push\('黑森林祭壇鑰匙/, 'altar keys no longer drop');
assert.doesNotMatch(script, /黑森林祭壇鑰匙 <b>/, 'altar keys are hidden from the resource bar');
assert.match(script, /\['black-forest', 'black-forest-altar'\]\.includes\(saved\.selectedMapId\)/, 'old saves on removed maps are migrated safely');
assert.match(script, /saved\.selectedMapId = 'plains-entrance'/, 'removed-map saves return to plains entrance');
assert.match(index, /VER\. 0\.1\.1/, 'temporary content removal increments the patch version');
assert.match(index, /remove-black-forest-v123/, 'the main script cache key changes with the update');

console.log('black-forest-removal: assertions passed');
