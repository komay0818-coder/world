const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'adventure-info.css'), 'utf8');

assert.match(html, /class="battle-center"[\s\S]*?class="battle-field"[\s\S]*?class="battle-adventure-info"/, 'the compact battlefield and information modules share one center container');
assert.match(html, /id="region-progress-count"[\s\S]*?id="round-loot-list"/, 'region progress and round loot have dedicated live targets');
assert.match(html, /adventure-info\.css\?v=20260822-battle-density-v1/, 'the information layout uses a fresh cache key');
assert.match(css, /grid-template-rows:\s*minmax\(310px, 66%\) minmax\(190px, 34%\)/, 'desktop battlefield keeps about two thirds of the former center height');
assert.doesNotMatch(css, /\.battle-center[\s\S]{0,300}transform:\s*scale/, 'the battlefield is resized through layout rather than transform scaling');
assert.match(script, /ChapterOneProgressionPolicy\.REQUIREMENTS\[currentMap\.id\]/, 'region progress reads the real map requirement');
assert.match(script, /progress\.mapKillProgress\?\.\[currentMap\.id\]/, 'region progress reads persisted kills for the active map');
assert.match(script, /roundLoot:\s*\{\}/, 'a new battle entry resets round loot');
assert.match(script, /addRoundLoot\('gold',[\s\S]*?materialDrops\.forEach[\s\S]*?recipeDrops\.forEach[\s\S]*?equipmentDrop/, 'victory rewards accumulate gold, materials, recipes and equipment');
assert.match(script, /Object\.values\(battle\.roundLoot \|\| \{\}\)[\s\S]*?slice\(0, 8\)/, 'the loot module remains bounded');

console.log('battle-adventure-info: assertions passed');
