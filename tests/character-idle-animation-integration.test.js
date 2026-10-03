const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-mage-fire-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human mage fire frame ${frame} exists`);
}
for (let frame = 1; frame <= 3; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-warrior-three-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human warrior frame ${frame} exists`);
}
for (let frame = 1; frame <= 4; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-assassin-strip-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human assassin frame ${frame} exists`);
}
for (let frame = 1; frame <= 4; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-hunter-strip-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human hunter frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-hunter-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `elf hunter frame ${frame} exists`);
}
for (let frame = 1; frame <= 3; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-warrior-three-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `orc warrior frame ${frame} exists`);
}
for (let frame = 1; frame <= 4; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-assassin-four-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `orc assassin frame ${frame} exists`);
}
for (const filename of ['frame-01.png', 'frame-02.png', 'frame-03-replacement.png', 'frame-04.png', 'frame-05.png']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-hunter-five-frame', filename)), `orc hunter ${filename} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'orc-mage-fire-cast-five-frame-aligned-v3', `frame-${String(frame).padStart(2, '0')}.png`)), `orc mage frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-mage-five-frame-v2', `frame-${String(frame).padStart(2, '0')}.png`)), `elf mage frame ${frame} exists`);
}
assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'elf-hunter-five-frame-v1', 'frame-04-05-transition.png')), 'elf hunter transition frame exists');
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-warrior-five-frame', `frame-${String(frame).padStart(2, '0')}.png`)), `undead warrior frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'human-priest-five-frame-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `human priest frame ${frame} exists`);
}
for (let frame = 1; frame <= 5; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-rise-five-frame-v2', `frame-${String(frame).padStart(2, '0')}.png`)), `undead assassin rise frame ${frame} exists`);
}
for (let frame = 1; frame <= 4; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-mage-cast-four-frame-aligned-v1', `frame-${String(frame).padStart(2, '0')}.png`)), `undead mage frame ${frame} exists`);
}
for (let frame = 1; frame <= 6; frame += 1) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'calibration-tests', 'undead-chain-six-frame-v2', `frame-${String(frame).padStart(2, '0')}.png`)), `undead priest frame ${frame} exists`);
}
assert.match(html, /id="character-idle-preview"[\s\S]*?id="character-idle-frame"/);
assert.match(html, /human-mage-fire-five-frame-v1\/frame-01\.png/, 'preview starts from the human mage fire sequence');
assert.match(script, /const characterIdleAnimations\s*=\s*\{/, 'characters use one shared animation registry');
assert.match(script, /'human:warrior':\s*\{[\s\S]*?human-warrior-three-frame-v1[\s\S]*?order: \[0, 1, 2\],[\s\S]*?frameDurationMs: 2000 \/ 3/, 'human warrior uses the approved two-second three-frame sequence');
assert.match(script, /'human:assassin':\s*\{[\s\S]*?human-assassin-strip-v1[\s\S]*?order: \[0, 1, 2, 3\],[\s\S]*?frameDurationMs: 500/, 'human assassin uses the approved two-second four-frame sequence');
assert.match(script, /'human:hunter':\s*\{[\s\S]*?human-hunter-strip-v1[\s\S]*?order: \[0, 1, 2, 3\],[\s\S]*?frameDurationMs: 500/, 'human hunter uses the approved two-second four-frame sequence');
assert.match(script, /'human:mage':\s*\{[\s\S]*?human-mage-fire-five-frame-v1[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'human mage uses the approved 2.5-second fire-cast sequence');
assert.match(script, /'human:priest':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 180/, 'human priest uses the five-frame ping-pong sequence');
assert.match(script, /'orc:warrior':\s*\{[\s\S]*?order: \[0, 1, 2, 1\],[\s\S]*?frameDurationMs: 437\.5/, 'orc warrior uses the 1.75-second three-frame ping-pong sequence');
assert.match(script, /'orc:assassin':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 2, 1\],[\s\S]*?frameDurationMs: 1000 \/ 3/, 'orc assassin uses the two-second four-frame ping-pong sequence');
assert.match(script, /'orc:hunter':\s*\{[\s\S]*?frame-03-replacement\.png[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'orc hunter uses the approved 2.5-second five-frame sequence');
assert.match(script, /'orc:mage':\s*\{[\s\S]*?orc-mage-red-cast-five-frame-v1\/hq[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'orc mage uses the approved 2.5-second red cast one-shot sequence');
assert.match(script, /'elf:warrior':\s*\{[\s\S]*?elf-warrior-five-frame-v1-hq[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'elf warrior uses the approved 2.5-second five-frame one-shot sequence');
assert.match(script, /'elf:mage':\s*\{[\s\S]*?order: \[0, 1, 2, 3, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 180/, 'elf mage uses the five-frame ping-pong sequence');
assert.match(script, /'elf:hunter':\s*\{[\s\S]*?frame-04-05-transition\.png[\s\S]*?order: \[0, 1, 2, 3, 4, 5, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 320/, 'only elf hunter uses the 3.2-second six-frame ping-pong sequence');
assert.match(script, /'elf:assassin':\s*\{[\s\S]*?elf-assassin-five-frame-v3-hq[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'elf assassin uses the approved 2.5-second five-frame one-shot sequence');
assert.match(script, /'undead:warrior':\s*\{[\s\S]*?undead-warrior-five-frame[\s\S]*?order: \[0, 1, 2, 3, 4\],[\s\S]*?frameDurationMs: 500/, 'undead warrior uses the approved 2.5-second five-frame sequence');
assert.match(script, /'undead:assassin':\s*\{[\s\S]*?undead-rise-five-frame-v2[\s\S]*?order: \[0, 1, 2, 4, 3, 4, 2, 1\],[\s\S]*?frameDurationMs: 2500 \/ 8/, 'undead assassin uses the approved 2.5-second rise sequence');
assert.match(script, /'undead:mage':\s*\{[\s\S]*?undead-mage-cast-four-frame-aligned-v1[\s\S]*?order: \[0, 1, 2, 3, 2, 1\],[\s\S]*?frameDurationMs: 2500 \/ 6/, 'undead mage uses the approved 2.5-second four-frame cast sequence');
assert.match(script, /'undead:priest':\s*\{[\s\S]*?undead-chain-six-frame-v2[\s\S]*?order: \[0, 1, 2, 3, 4, 5, 4, 3, 2, 1\],[\s\S]*?frameDurationMs: 250/, 'undead priest uses the approved 2.5-second six-frame chain sequence');
assert.doesNotMatch(script, /\.gif/, 'idle previews do not use GIF files');
assert.match(script, /preloadCharacterIdleFrames\(frames\)/, 'sequence frames are preloaded before playback');
assert.match(script, /clearInterval\(characterIdleTimer\)/, 'switching roles stops the prior sequence timer');
assert.match(script, /if \(orderIndex >= animation\.order\.length - 1\)[\s\S]*?characterIdleTimer = null/, 'idle sequences stop after one complete playback');
assert.doesNotMatch(script, /orderIndex = \(orderIndex \+ 1\) % animation\.order\.length/, 'idle sequences do not loop');
assert.match(script, /characterIdleReducedMotion\.matches/, 'reduced-motion mode holds on the first frame');
assert.match(script, /characterIdleAnimations\[animationKey\]/, 'race and class select the configured shared animation');
assert.match(script, /stopCharacterIdleAnimation\(\)/, 'animation has an explicit stop path');
assert.match(script, /'human:assassin': \{ scale: 1\.0712, offsetX: -10, offsetY: 5 \}/, 'human assassin keeps its offsets and receives the second-round scale');
assert.match(script, /'human:mage': \{ scale: 1\.30815, offsetX: -5, offsetY: -10 \}/, 'human mage keeps its foot alignment and receives the focused visual scale correction');
assert.match(script, /'elf:hunter': \{ scale: 1\.242, offsetX: 3, offsetY: -3 \}/, 'elf hunter keeps its offsets and receives the second-round scale');
assert.match(script, /'undead:priest': \{ scale: 1\.2744, offsetX: 28, offsetY: -3 \}/, 'undead priest keeps its offsets and receives the second-round scale');
assert.doesNotMatch(script, /'undead:assassin': \{ scale:/, 'undead assassin remains excluded from display calibration');
assert.match(css, /\.creation-idle-preview img\{[^}]*bottom:0;[^}]*width:min\(66%,286px\);[^}]*height:auto;[^}]*translate\(var\(--creation-character-offset-x,0\),var\(--creation-character-offset-y,0\)\)[^}]*scale\(var\(--creation-character-scale,1\)\);[^}]*transform-origin:bottom center;/, 'portrait keeps its existing size and uses a configurable bottom-center foot anchor');
assert.match(css, /@keyframes character-idle-breathe\{0%,100%\{[^}]*scale\(var\(--creation-character-scale,1\)\)\}50%\{[^}]*scale\(var\(--creation-character-scale,1\)\) scale\(1\.004\)\}\}/, 'breathing preserves the per-character calibration and adds only a subtle proportional scale');
assert.match(css, /animation:character-idle-breathe 3\.2s ease-in-out 1/, 'single-PNG breathing plays only once');

console.log('character-single-png-idle-integration: assertions passed');
