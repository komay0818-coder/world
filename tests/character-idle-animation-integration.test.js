const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'human-mage-idle-03.png')), 'single mage portrait exists');
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-hunter-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `elf hunter frame ${frame} exists`);
}
for (let frame = 1; frame <= 3; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-warrior-three-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `orc warrior frame ${frame} exists`);
}
for (let frame = 1; frame <= 4; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-assassin-four-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `orc assassin frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-mage-five-frame-v2', `frame-${String(frame).padStart(2, '0')}.png`)), `elf mage frame ${frame} exists`);
}
assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-hunter-five-frame-v1', 'frame-04-05-transition.png')), 'elf hunter transition frame exists');
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-priest-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human priest frame ${frame} exists`);
}
for (const frame of [1, 5, 2, 3]) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-assassin-five-frame', `frame-${String(frame).padStart(2, '0')}.png`)), `undead assassin frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-mage-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `undead priest frame ${frame} exists`);
}
assert.match(html, /id="character-idle-preview"[\s\S]*?id="character-idle-frame"/);
assert.match(html, /human-mage-idle-03\.png/, 'preview starts from the selected single PNG');
assert.match(script, /const characterIdleAnimations\s*=\s*\{/, 'characters use one shared animation registry');
assert.match(script, /'human:mage':\s*\{ portrait: 'assets\/character-portraits\/human-mage-idle-03\.png/, 'human mage keeps its single-PNG pilot');
assert.match(script, /'human:priest':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 180/, 'human priest uses the five-frame ping-pong sequence');
assert.match(script, /'orc:warrior':\s*\{[\s\S]*?order: \[0, 1, 2, 1\],[\s\S]*?frameDurationMs: 437\.5/, 'orc warrior uses the 1.75-second three-frame ping-pong sequence');
assert.match(script, /'orc:assassin':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 2, 1\],[\s\S]*?frameDurationMs: 1000 \/ 3/, 'orc assassin uses the two-second four-frame ping-pong sequence');
assert.match(script, /'elf:mage':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 180/, 'elf mage uses the five-frame ping-pong sequence');
assert.match(script, /'elf:hunter':\s*\{[\s\S]*?frame-04-05-transition\.png[\s\S]*?order: \[0, 1, 2, 3, 4, 5, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 320/, 'only elf hunter uses the 3.2-second six-frame ping-pong sequence');
assert.match(script, /'undead:assassin':\s*\{[\s\S]*?\[1, 5, 2, 3\][\s\S]*?order: \[0, 1, 2, 3, 2, 1\],[\s\S]*?frameDurationMs: 250/, 'undead assassin uses the approved 1.5-second reordered sequence');
assert.match(script, /'undead:priest':\s*\{[\s\S]*?undead-mage-five-frame-v1[\s\S]*?order: \[0, 1, 2, 3, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 312\.5/, 'undead priest uses the approved 2.5-second five-frame ping-pong sequence');
assert.doesNotMatch(script, /\.gif/, 'idle previews do not use GIF files');
assert.match(script, /preloadCharacterIdleFrames\(frames\)/, 'sequence frames are preloaded before playback');
assert.match(script, /clearInterval\(characterIdleTimer\)/, 'switching roles stops the prior sequence timer');
assert.match(script, /characterIdleReducedMotion\.matches/, 'reduced-motion mode holds on the first frame');
assert.match(script, /characterIdleAnimations\[animationKey\]/, 'race and class select the configured shared animation');
assert.match(script, /stopCharacterIdleAnimation\(\)/, 'animation has an explicit stop path');
assert.match(css, /\.creation-idle-preview img\{[^}]*bottom:0;[^}]*width:min\(66%,286px\);[^}]*height:auto;[^}]*transform:translateX\(-50%\) scale\(1\);[^}]*transform-origin:bottom center;/, 'portrait keeps its existing size and a bottom-center foot anchor');
assert.match(css, /@keyframes character-idle-breathe\{0%,100%\{transform:translateX\(-50%\) scale\(1\)\}50%\{transform:translateX\(-50%\) scale\(1\.004\)\}\}/, 'breathing uses only a subtle proportional scale');
assert.match(css, /animation:character-idle-breathe 3\.2s ease-in-out infinite/, 'breathing loops gently at the requested pace');

console.log('character-single-png-idle-integration: assertions passed');
