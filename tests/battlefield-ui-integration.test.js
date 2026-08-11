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
assert.match(script, /data-member-id="\$\{member\.id\}"/, 'party battlefield units have stable animation targets');
assert.match(script, /playPartyMemberCombatAnimation\(member,[\s\S]*?kind: 'skill', skillName: skill\.name/, 'skills animate every party member and expose the skill name');
assert.match(script, /playPartyMemberCombatAnimation\(member, \[targetIndex\], \{ kind: 'basic' \}\)/, 'basic attacks animate every party member');
assert.match(css, /\.character-attack-effect\.attack-kind-skill::after/, 'skill attacks show an in-field skill label');
assert.match(css, /prefers-reduced-motion: reduce/, 'combat animation respects reduced-motion preferences');
assert.match(css, /#battle-player-art\[aria-label\][\s\S]*?height: 32\.6667% !important;/, 'main player art is reduced to about seventy percent of its previous battlefield height');
assert.match(css, /\.player-battle-stage[\s\S]*?height: 24\.5%;/, 'party member stage is reduced to about seventy percent of its previous height');
assert.match(css, /data-count="3"[\s\S]*?nth-child\(3\)[\s\S]*?left: 74%;/, 'desktop formation reserves distinct centered positions for four total players');
assert.match(css, /@media \(max-width: 700px\)[\s\S]*?data-count="3"[\s\S]*?nth-child\(3\)[\s\S]*?left: 81%;/, 'mobile formation reserves distinct positions for four total players');
assert.doesNotMatch(html, /data-menu-action="材料"/, 'materials no longer duplicate the backpack in the battle menu');
assert.doesNotMatch(script, /button\.dataset\.menuAction === '材料'/, 'the removed material shortcut has no stale click handler');
assert.match(css, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\) !important;/, 'the seven remaining battle actions share the full row');
assert.match(css, /body:has\(\.battle-screen:not\(\.hidden\)\) \.toast[\s\S]*?bottom: calc\(92px/, 'battle loot notifications sit above the action bar');

console.log('battlefield UI integration: assertions passed');
