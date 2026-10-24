const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const abilityRenderer = script.slice(script.indexOf('function renderCharacterAbilities()'), script.indexOf('function getDropLookupItems()'));

assert.match(html, /style\.css\?v=20261023-ability-avatar-v1/, 'the updated ability portrait style bypasses stale browser caches');
assert.match(abilityRenderer, /const avatar = battleCharacterActionArt\(character\)/, 'the ability panel reuses the active character portrait mapping');
assert.match(abilityRenderer, /<img class="ability-character-avatar" src="\$\{avatar\}"/, 'the character portrait is rendered in the ability summary');
assert.doesNotMatch(abilityRenderer, /creation-race-icon race-/, 'the ability summary no longer renders a race totem');
assert.match(css, /\.ability-character-avatar\{[\s\S]*?border-radius:50%[\s\S]*?object-fit:cover/, 'the portrait remains circular and correctly cropped');

console.log('character ability avatar: assertions passed');
