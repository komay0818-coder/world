const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

for (const frame of ['01', '02', '03']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', `human-warrior-idle-${frame}.png`)), `idle frame ${frame} exists`);
}
for (const frame of ['01', '02', '03', '04']) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', `human-mage-idle-${frame}.png`)), `mage idle frame ${frame} exists`);
}
assert.match(html, /id="character-idle-preview"[\s\S]*?id="character-idle-frame"/);
assert.match(script, /const characterIdleAnimations\s*=\s*\{/, 'all character sequences use one animation registry');
assert.match(script, /'human:warrior':[\s\S]*?sequence:\s*\[0, 1, 2, 1\]/, 'warrior preserves its four-beat sequence');
assert.match(script, /'human:mage':[\s\S]*?human-mage-idle-04\.png/, 'mage uses all four PNG frames');
assert.match(script, /animation\.sequence \|\| animation\.frames\.map/, 'sequences default to playing every PNG in order');
assert.match(script, /Promise\.all\(animation\.frames\.map/, 'all frames preload before playback');
assert.match(script, /characterIdleAnimations\[animationKey\]/, 'race and class select the configured shared animation');
assert.match(script, /stopCharacterIdleAnimation\(\)/, 'animation has an explicit stop path');
assert.match(script, /bottomOffsets:\s*\[0, -8, -34\]/, 'warrior keeps its measured alignment without changing layout');
assert.match(script, /getBoundingClientRect\(\)\.width \/ animation\.sourceWidth/, 'source-pixel offsets scale with the fixed rendered width');
assert.match(css, /\.creation-idle-preview img\{[^}]*position:absolute;[^}]*left:50%;[^}]*bottom:var\(--idle-frame-bottom,0px\);[^}]*width:min\(66%,286px\);[^}]*height:auto;[^}]*transform:translateX\(-50%\);/, 'frames share a fixed width and bottom anchor');

console.log('character-idle-png-sequence-integration: assertions passed');
