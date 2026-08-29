const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.ok(fs.existsSync(path.join(root, 'assets', 'healing-potion.png')));
assert.ok(fs.existsSync(path.join(root, 'assets', 'mana-potion.png')));
assert.match(script, /existingHealingPotion\.image = 'assets\/healing-potion\.png/);
assert.match(script, /existingManaPotion\.image = 'assets\/mana-potion\.png/);
assert.match(script, /id: 'healing-potion'[\s\S]*?image: 'assets\/healing-potion\.png/);
assert.match(script, /id: 'mana-potion'[\s\S]*?image: 'assets\/mana-potion\.png/);
assert.match(html, /id="potion-button"[\s\S]*?src="assets\/healing-potion\.png/);
assert.match(html, /id="mana-potion-button"[\s\S]*?src="assets\/mana-potion\.png/);
assert.match(style, /\.potion-button \.potion-image\{[^}]*object-fit:contain/);

console.log('potion image integration: assertions passed');
