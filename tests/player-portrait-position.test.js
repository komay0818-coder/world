const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'monster-slots.css'), 'utf8');

assert.match(
  html,
  /<div class="battle-field">[\s\S]*?id="battle-player-art"[\s\S]*?<\/div>\s*<div class="battle-bottom">/,
  'the player portrait is a child of the battlefield rather than the lower controls'
);
assert.match(css, /\.battle-screen \.battle-field\s*{[\s\S]*?position:\s*relative\s*!important;[\s\S]*?overflow:\s*hidden\s*!important;/);
const portraitAnchor = css.match(/#battle-screen \.battle-field:has\(#player-battle-stage\) #battle-player-art\[aria-label\]\s*{[\s\S]*?\n}/)?.[0] || '';
assert.match(portraitAnchor, /position:\s*absolute\s*!important;/);
assert.match(portraitAnchor, /inset:\s*auto auto clamp\(14px, 3%, 24px\) clamp\(14px, 3%, 28px\)\s*!important;/);
assert.match(portraitAnchor, /translate:\s*none;/);
assert.match(portraitAnchor, /transform:\s*none;/);
assert.doesNotMatch(portraitAnchor, /(?:translate|transform):\s*none\s*!important;/, 'the positioning rule must not suppress attack keyframe transforms');

console.log('player-portrait-position: assertions passed');
