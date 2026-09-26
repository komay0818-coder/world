const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'assets', 'character-portraits', 'human-mage-idle-03.png')), 'single mage portrait exists');
assert.match(html, /id="character-idle-preview"[\s\S]*?id="character-idle-frame"/);
assert.match(html, /human-mage-idle-03\.png/, 'preview starts from the selected single PNG');
assert.match(script, /const characterIdlePortraits\s*=\s*\{/, 'characters use one shared portrait registry');
assert.match(script, /'human:mage':\s*'assets\/character-portraits\/human-mage-idle-03\.png/, 'only the human mage pilot is enabled');
assert.doesNotMatch(script, /characterIdleTimer|characterIdlePreloads|\.gif/, 'single-PNG idle animation does not use frame timers or GIF files');
assert.match(script, /characterIdlePortraits\[animationKey\]/, 'race and class select the configured shared animation');
assert.match(script, /stopCharacterIdleAnimation\(\)/, 'animation has an explicit stop path');
assert.match(css, /\.creation-idle-preview img\{[^}]*bottom:0;[^}]*width:min\(66%,286px\);[^}]*height:auto;[^}]*transform:translateX\(-50%\) scale\(1\);[^}]*transform-origin:bottom center;/, 'portrait keeps its existing size and a bottom-center foot anchor');
assert.match(css, /@keyframes character-idle-breathe\{0%,100%\{transform:translateX\(-50%\) scale\(1\)\}50%\{transform:translateX\(-50%\) scale\(1\.004\)\}\}/, 'breathing uses only a subtle proportional scale');
assert.match(css, /animation:character-idle-breathe 3\.2s ease-in-out infinite/, 'breathing loops gently at the requested pace');

console.log('character-single-png-idle-integration: assertions passed');
