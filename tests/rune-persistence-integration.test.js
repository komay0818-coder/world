const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const handler = source.match(/const runeButton = event\.target\.closest\('\[data-socket-item\]'\);[\s\S]*?\n  \}/)?.[0] || '';

assert.match(handler, /const progress = getProgress\(\);/, 'rune action loads one progress object');
assert.match(handler, /RunePolicy\.socketRune\(progress, runeButton\.dataset\.socketItem, runeButton\.dataset\.socketRune\)/, 'rune action mutates the loaded progress object');
assert.match(handler, /saveProgress\(progress\)/, 'rune action saves the same mutated progress object');
assert.doesNotMatch(handler, /saveProgress\(getProgress\(\)\)/, 'rune action never discards its mutation by reloading progress before save');

console.log('rune-persistence-integration: assertions passed');
