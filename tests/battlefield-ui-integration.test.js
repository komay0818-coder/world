const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'monster-slots.css'), 'utf8');

assert.match(html, /class="battlefield-zone-label enemy-zone-label"/, 'enemy battlefield has a shared label');
assert.match(html, /id="player-battle-stage"/, 'player party has a shared battlefield display layer');
assert.match(html, /id="player-stage-info"/, 'main player information floats near the battlefield art');
assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/, 'desktop enemies share a four-unit battlefield row');
assert.match(css, /#enemy-squad \.monster-battle-slot[\s\S]*?border: 0 !important;[\s\S]*?background: none !important;/, 'individual monster cards have no frame or background');
assert.match(css, /\.monster-battle-slot\.boss \.monster-slot-image \{ scale: 1\.48 !important; \}/, 'boss art is visually larger without a separate card');
assert.match(css, /\.player-battle-stage[\s\S]*?justify-content: center;/, 'party units auto-center on their shared ground');
assert.match(script, /battleCharacterArt\[`\$\{member\.character\.race\}:\$\{member\.character\.job\}`\]/, 'party display reuses existing character art');
assert.match(script, /其餘 \$\{reserveCount\}/, 'overflow enemies are not described as a front or back row');

console.log('battlefield UI integration: assertions passed');
