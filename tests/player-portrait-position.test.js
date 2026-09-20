const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'monster-slots.css'), 'utf8');

assert.match(
  html,
  /<main class="battle-center">[\s\S]*?<div class="battle-field">[\s\S]*?id="battle-player-art"[\s\S]*?<section class="battle-adventure-info"[\s\S]*?<\/main>\s*<div class="battle-bottom">/,
  'the player portrait is a child of the battlefield rather than the lower controls'
);
assert.match(css, /\.battle-screen \.battle-field\s*{[\s\S]*?position:\s*relative\s*!important;[\s\S]*?overflow:\s*hidden\s*!important;/);
const portraitAnchor = css.match(/#battle-screen \.battle-field:has\(#player-battle-stage\) #battle-player-art\[aria-label\]\s*{[\s\S]*?\n}/)?.[0] || '';
assert.match(portraitAnchor, /position:\s*absolute\s*!important;/);
assert.match(portraitAnchor, /inset:\s*auto auto clamp\(18px, 6%, 48px\) 50%\s*!important;/);
assert.match(portraitAnchor, /translate:\s*-50% 0;/);
assert.match(portraitAnchor, /transform:\s*none;/);
assert.doesNotMatch(portraitAnchor, /(?:translate|transform):[^;]*!important;/, 'the positioning rule must not suppress attack keyframe transforms');
assert.match(css, /data-player-party-size="1"[\s\S]*?left:\s*50%\s*!important/, 'a solo player is centered');
assert.match(css, /data-player-party-size="2"[\s\S]*?left:\s*25%\s*!important[\s\S]*?data-party-slot="2"[\s\S]*?left:\s*75%\s*!important/, 'two players use left and right slots');
assert.match(css, /data-player-party-size="3"[\s\S]*?left:\s*20%\s*!important[\s\S]*?data-party-slot="2"[\s\S]*?left:\s*50%\s*!important[\s\S]*?data-party-slot="3"[\s\S]*?left:\s*80%\s*!important/, 'three players use evenly spaced slots');

console.log('player-portrait-position: assertions passed');
